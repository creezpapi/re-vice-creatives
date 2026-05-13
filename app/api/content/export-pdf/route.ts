import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns an HTML page styled for print/PDF.
// The client calls window.print() which the browser renders as PDF.
// This avoids pdfkit's Node.js native dependencies which fail on Vercel.

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date param required' }, { status: 400 });

  const { data: tasks } = await supabase
    .from('content_tasks')
    .select('*')
    .eq('filming_date', date);

  const { data: deliverables } = await supabase
    .from('content_deliverables')
    .select('*')
    .in('task_id', (tasks || []).map((t) => t.id))
    .order('position', { ascending: true });

  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name');

  const productMap: Record<string, string> = Object.fromEntries(
    (products || []).map((p) => [p.id, p.name])
  );

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const taskHtml = (tasks || []).map((task) => {
    const taskDelivs = (deliverables || []).filter((d) => d.task_id === task.id);
    const delivHtml = taskDelivs.map((d) => `
      <div class="deliv">
        <strong>${esc(d.deliverable_type)}</strong>
        ${d.reference_url ? `<div class="meta">Reference: ${esc(d.reference_url)}</div>` : ''}
        ${d.product_ids?.length ? `<div class="meta">Tagged products: ${d.product_ids.map((id: string) => esc(productMap[id] ?? id)).join(', ')}</div>` : ''}
        ${d.asset_paths?.length ? `<div class="meta">Files: ${d.asset_paths.map((p: string) => esc(p.split('/').pop() ?? p)).join(', ')}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="task">
        <h2>${esc(task.name)}</h2>
        ${task.filming_date ? `<div class="field"><span class="label">Filming date:</span> ${esc(task.filming_date)}</div>` : ''}
        ${task.post_date ? `<div class="field"><span class="label">Post date:</span> ${esc(task.post_date)}</div>` : ''}
        ${task.team_member_tags?.length ? `<div class="field"><span class="label">Team tags:</span> ${task.team_member_tags.map(esc).join(', ')}</div>` : ''}
        ${task.filming_team?.length ? `<div class="field"><span class="label">Filming team:</span> ${task.filming_team.map(esc).join(', ')}</div>` : ''}
        ${task.editing_team?.length ? `<div class="field"><span class="label">Editing team:</span> ${task.editing_team.map(esc).join(', ')}</div>` : ''}
        ${task.product_ids?.length ? `<div class="field"><span class="label">Products:</span> ${task.product_ids.map((id: string) => esc(productMap[id] ?? id)).join(', ')}</div>` : ''}
        ${task.styling_notes ? `<div class="field"><span class="label">Styling notes:</span><div class="notes">${esc(task.styling_notes)}</div></div>` : ''}
        ${taskDelivs.length ? `<div class="deliverables-header">Deliverables</div>${delivHtml}` : ''}
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Content — ${esc(dateLabel)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 40px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 28px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .task { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; page-break-inside: avoid; }
    .task:last-child { border-bottom: none; }
    h2 { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
    .field { margin-bottom: 5px; line-height: 1.5; }
    .label { font-weight: 500; color: #555; }
    .notes { margin-top: 3px; white-space: pre-line; color: #333; }
    .deliverables-header { font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-top: 12px; margin-bottom: 6px; }
    .deliv { background: #f5f5f5; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; }
    .deliv strong { font-size: 12px; }
    .meta { color: #555; margin-top: 3px; font-size: 11px; word-break: break-all; }
    .empty { color: #888; font-style: italic; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Content Creation — ${esc(dateLabel)}</h1>
  ${tasks && tasks.length > 0 ? taskHtml : '<p class="empty">No tasks for this date.</p>'}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

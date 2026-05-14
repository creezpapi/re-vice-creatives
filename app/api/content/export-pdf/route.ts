import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns an HTML page styled for print/PDF.
// window.print() fires automatically when opened in a new tab.

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
    .select('id, name, image_url, key_details, product_link');

  type ProductRow = { id: string; name: string; image_url: string | null; key_details: string | null; product_link: string | null };
  const productMap: Record<string, ProductRow> = Object.fromEntries(
    (products || []).map((p) => [p.id, p])
  );

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function productCardHtml(id: string) {
    const p = productMap[id];
    if (!p) return `<span class="product-tag">${esc(id)}</span>`;
    return `
      <div class="product-card">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="product-img" />` : '<div class="product-img-placeholder">No image</div>'}
        <div class="product-info">
          <strong>${esc(p.name)}</strong>
          ${p.key_details ? `<div class="product-details">${esc(p.key_details).replace(/\n/g, '<br/>')}</div>` : ''}
          ${p.product_link ? `<div class="product-link"><a href="${esc(p.product_link)}">${esc(p.product_link)}</a></div>` : ''}
        </div>
      </div>
    `;
  }

  const taskHtml = (tasks || []).map((task) => {
    const taskDelivs = (deliverables || []).filter((d) => d.task_id === task.id);

    const delivHtml = taskDelivs.map((d) => `
      <div class="deliv">
        <div class="deliv-type">${esc(d.deliverable_type)}</div>
        ${d.reference_url ? `<div class="meta">Reference: <a href="${esc(d.reference_url)}">${esc(d.reference_url)}</a></div>` : ''}
        ${d.product_ids?.length ? `
          <div class="meta sub-label">Tagged products:</div>
          <div class="product-cards">${d.product_ids.map(productCardHtml).join('')}</div>
        ` : ''}
        ${d.asset_paths?.length ? `<div class="meta">Files: ${d.asset_paths.map((p: string) => esc(p.split('/').pop() ?? p)).join(', ')}</div>` : ''}
      </div>
    `).join('');

    const taskProductsHtml = task.product_ids?.length ? `
      <div class="section-label">Products from library</div>
      <div class="product-cards">${task.product_ids.map(productCardHtml).join('')}</div>
    ` : '';

    return `
      <div class="task">
        <h2>${esc(task.name)}</h2>
        <div class="fields">
          ${task.filming_date ? `<div class="field"><span class="label">Filming date:</span> ${esc(task.filming_date)}</div>` : ''}
          ${task.post_date ? `<div class="field"><span class="label">Post date:</span> ${esc(task.post_date)}</div>` : ''}
          ${task.team_member_tags?.length ? `<div class="field"><span class="label">Team tags:</span> ${task.team_member_tags.map(esc).join(', ')}</div>` : ''}
          ${task.filming_team?.length ? `<div class="field"><span class="label">Filming team:</span> ${task.filming_team.map(esc).join(', ')}</div>` : ''}
          ${task.editing_team?.length ? `<div class="field"><span class="label">Editing team:</span> ${task.editing_team.map(esc).join(', ')}</div>` : ''}
          ${task.styling_notes ? `<div class="field"><span class="label">Styling notes:</span><div class="notes">${esc(task.styling_notes).replace(/\n/g, '<br/>')}</div></div>` : ''}
        </div>
        ${taskProductsHtml}
        ${taskDelivs.length ? `<div class="section-label">Deliverables</div>${delivHtml}` : ''}
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
    .task { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e0e0e0; page-break-inside: avoid; }
    .task:last-child { border-bottom: none; }
    h2 { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
    .fields { margin-bottom: 12px; }
    .field { margin-bottom: 5px; line-height: 1.5; }
    .label { font-weight: 500; color: #555; }
    .notes { margin-top: 3px; white-space: pre-line; color: #333; }
    .section-label { font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-top: 14px; margin-bottom: 8px; border-top: 1px solid #eee; padding-top: 10px; }
    .deliv { background: #f5f5f5; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
    .deliv-type { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    .meta { color: #555; margin-top: 3px; font-size: 11px; word-break: break-all; }
    .meta a { color: #0066cc; }
    .sub-label { font-weight: 500; margin-bottom: 4px; }
    /* Product cards */
    .product-cards { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .product-card { display: flex; gap: 8px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px; width: 200px; page-break-inside: avoid; }
    .product-img { width: 64px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
    .product-img-placeholder { width: 64px; height: 80px; background: #f0f0f0; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #999; }
    .product-info { flex: 1; min-width: 0; }
    .product-info strong { font-size: 11px; display: block; margin-bottom: 3px; word-break: break-word; }
    .product-details { font-size: 10px; color: #555; line-height: 1.4; margin-top: 2px; word-break: break-word; }
    .product-link { font-size: 9px; color: #0066cc; margin-top: 3px; word-break: break-all; }
    .product-link a { color: #0066cc; }
    .empty { color: #888; font-style: italic; }
    @media print {
      body { padding: 20px; }
      .product-cards { break-inside: avoid; }
    }
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

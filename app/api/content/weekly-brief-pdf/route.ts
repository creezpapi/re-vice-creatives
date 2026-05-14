import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const week = req.nextUrl.searchParams.get('week'); // YYYY-MM-DD (Monday)
  if (!week) return NextResponse.json({ error: 'week param required' }, { status: 400 });

  // Fetch brief + days
  const { data: brief } = await supabase
    .from('weekly_briefs')
    .select('*')
    .eq('week_start', week)
    .single();

  const days = brief ? (await supabase
    .from('weekly_brief_days')
    .select('*')
    .eq('brief_id', brief.id)
    .order('day_index', { ascending: true })).data ?? [] : [];

  // Fetch products for name lookup
  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name, image_url, key_details, product_link');

  type ProductRow = { id: string; name: string; image_url: string | null; key_details: string | null; product_link: string | null };
  const productMap: Record<string, ProductRow> = Object.fromEntries(
    (products ?? []).map((p) => [p.id, p])
  );

  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Compute week label
  const weekDate = new Date(week + 'T00:00:00');
  const endDate = new Date(weekDate);
  endDate.setDate(endDate.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const weekLabel = weekDate.toLocaleDateString('en-US', opts) + ' – ' + endDate.toLocaleDateString('en-US', { ...opts, year: 'numeric' });

  function productCardHtml(id: string) {
    const p = productMap[id];
    if (!p) return '';
    return `<div class="product-card">
      ${p.image_url ? `<img src="${esc(p.image_url)}" class="product-img" alt="${esc(p.name)}" />` : '<div class="product-img-ph"></div>'}
      <div class="product-info">
        <strong>${esc(p.name)}</strong>
        ${p.key_details ? `<div class="product-detail">${esc(p.key_details)}</div>` : ''}
      </div>
    </div>`;
  }

  // Build a map of day_index -> day row
  const dayMap: Record<number, typeof days[0]> = Object.fromEntries(days.map(d => [d.day_index, d]));

  const daysHtml = DAY_LABELS.map((label, i) => {
    const d = dayMap[i];
    const isEmpty = !d || (
      !d.deliverable_types?.length &&
      !d.team_members?.length &&
      !d.product_ids?.length &&
      !d.reference_url &&
      !d.notes
    );

    // Date label for this day
    const dayDate = new Date(weekDate);
    dayDate.setDate(dayDate.getDate() + i);
    const dayDateLabel = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return `<div class="day${isEmpty ? ' empty-day' : ''}">
      <div class="day-header">${esc(dayDateLabel)}</div>
      ${isEmpty ? '<p class="empty-text">No brief for this day.</p>' : `
        ${d.deliverable_types?.length ? `<div class="field"><span class="label">Deliverables:</span> ${(d.deliverable_types as string[]).map(esc).join(', ')}</div>` : ''}
        ${d.team_members?.length ? `<div class="field"><span class="label">Team:</span> ${(d.team_members as string[]).map(esc).join(', ')}</div>` : ''}
        ${d.reference_url ? `<div class="field"><span class="label">Reference:</span> <a href="${esc(d.reference_url)}">${esc(d.reference_url)}</a></div>` : ''}
        ${d.notes ? `<div class="field notes-field"><span class="label">Notes:</span><div class="notes">${esc(d.notes).replace(/\n/g, '<br/>')}</div></div>` : ''}
        ${d.product_ids?.length ? `<div class="products-label label">Products:</div><div class="product-cards">${(d.product_ids as string[]).map(productCardHtml).join('')}</div>` : ''}
      `}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Weekly Brief — ${esc(weekLabel)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 40px; }
h1 { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
.subtitle { font-size: 13px; color: #555; margin-bottom: 28px; border-bottom: 2px solid #111; padding-bottom: 10px; }
.day { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; page-break-inside: avoid; }
.day:last-child { border-bottom: none; }
.day-header { font-size: 14px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.empty-day .day-header { color: #aaa; }
.empty-text { color: #bbb; font-style: italic; font-size: 11px; }
.field { margin-bottom: 5px; line-height: 1.5; }
.label { font-weight: 600; color: #444; margin-right: 4px; }
.notes-field .notes { margin-top: 2px; white-space: pre-line; color: #333; }
a { color: #0066cc; word-break: break-all; }
.products-label { margin-top: 8px; margin-bottom: 6px; display: block; }
.product-cards { display: flex; flex-wrap: wrap; gap: 8px; }
.product-card { display: flex; gap: 8px; background: #f5f5f5; border-radius: 6px; padding: 6px; width: 180px; }
.product-img { width: 52px; height: 66px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.product-img-ph { width: 52px; height: 66px; background: #e0e0e0; border-radius: 4px; flex-shrink: 0; }
.product-info { flex: 1; min-width: 0; }
.product-info strong { font-size: 11px; display: block; margin-bottom: 2px; word-break: break-word; }
.product-detail { font-size: 9px; color: #666; line-height: 1.3; }
@media print {
  body { padding: 20px; }
  .day { break-inside: avoid; }
}
</style>
</head>
<body>
<h1>Weekly Brief</h1>
<div class="subtitle">Week of ${esc(weekLabel)}</div>
${daysHtml}
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

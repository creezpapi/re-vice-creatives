import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// pdfkit is used for PDF generation — added to dependencies in package.json
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date param required' }, { status: 400 });

  // Fetch tasks for the given date
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

  // Build PDF
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  doc.fontSize(18).text('Content Creation — ' + dateLabel, { underline: false });
  doc.moveDown();

  for (const task of tasks || []) {
    doc.fontSize(14).text(task.name, { underline: true });
    doc.fontSize(10);
    if (task.filming_date) doc.text('Filming date: ' + task.filming_date);
    if (task.post_date) doc.text('Post date: ' + task.post_date);
    if (task.team_member_tags?.length) doc.text('Team: ' + task.team_member_tags.join(', '));
    if (task.filming_team?.length) doc.text('Filming team: ' + task.filming_team.join(', '));
    if (task.editing_team?.length) doc.text('Editing team: ' + task.editing_team.join(', '));
    if (task.product_ids?.length) doc.text('Products: ' + task.product_ids.map((id: string) => productMap[id] ?? id).join(', '));
    if (task.styling_notes) doc.text('Styling notes: ' + task.styling_notes);

    const taskDeliverables = (deliverables || []).filter((d) => d.task_id === task.id);
    if (taskDeliverables.length > 0) {
      doc.moveDown(0.5).text('Deliverables:');
      for (const d of taskDeliverables) {
        doc.text('  • ' + d.deliverable_type);
        if (d.reference_url) doc.text('    Reference: ' + d.reference_url);
        if (d.product_ids?.length) doc.text('    Tagged products: ' + d.product_ids.map((id: string) => productMap[id] ?? id).join(', '));
        if (d.asset_paths?.length) doc.text('    Files: ' + d.asset_paths.map((p: string) => p.split('/').pop()).join(', '));
      }
    }
    doc.moveDown();
  }

  if (!tasks || tasks.length === 0) {
    doc.fontSize(12).text('No tasks for this date.');
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', resolve));
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="content-${date}.pdf"`,
    },
  });
}

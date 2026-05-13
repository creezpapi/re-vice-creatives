import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tasks } = await supabase
    .from('content_tasks')
    .select('*')
    .order('filming_date', { ascending: true });

  const { data: deliverables } = await supabase
    .from('content_deliverables')
    .select('*')
    .order('position', { ascending: true });

  const tasksWithDeliverables = (tasks || []).map((t) => ({
    ...t,
    deliverables: (deliverables || []).filter((d) => d.task_id === t.id),
  }));

  return NextResponse.json({ tasks: tasksWithDeliverables });
}

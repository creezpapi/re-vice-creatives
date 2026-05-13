import { createClient } from '@/lib/supabase/server';
import type { ContentTask, ContentDeliverable } from '@/lib/types';
import ContentPageClient from '@/components/admin/content/ContentPageClient';

export default async function ContentCreationPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from('content_tasks')
    .select('*')
    .order('filming_date', { ascending: true });

  const { data: deliverables } = await supabase
    .from('content_deliverables')
    .select('*')
    .order('position', { ascending: true });

  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name, product_link, image_url')
    .order('name');

  const tasksWithDeliverables: ContentTask[] = (tasks || []).map((t) => ({
    ...t,
    deliverables: (deliverables || []).filter((d) => d.task_id === t.id),
  }));

  return (
    <ContentPageClient
      initialTasks={tasksWithDeliverables}
      products={products || []}
    />
  );
}

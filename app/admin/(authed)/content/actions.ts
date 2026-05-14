'use server';
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ContentTask, ContentDeliverable, DeliverableType, TeamMember } from '@/lib/types';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return supabase;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────────────────

export async function createContentTask(data: {
  name: string;
  filming_date: string | null;
  post_date: string | null;
  team_member_tags: TeamMember[];
  filming_team: TeamMember[];
  editing_team: TeamMember[];
  product_ids: string[];
  styling_notes: string | null;
}): Promise<{ id: string }> {
  const supabase = await requireAdmin();
  const { data: row, error } = await supabase
    .from('content_tasks')
    .insert({
      name: data.name.trim(),
      filming_date: data.filming_date || null,
      post_date: data.post_date || null,
      team_member_tags: data.team_member_tags,
      filming_team: data.filming_team,
      editing_team: data.editing_team,
      product_ids: data.product_ids,
      styling_notes: data.styling_notes || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  revalidatePath('/admin/content');
  return { id: row.id };
}

export async function updateContentTask(id: string, data: {
  name: string;
  filming_date: string | null;
  post_date: string | null;
  team_member_tags: TeamMember[];
  filming_team: TeamMember[];
  editing_team: TeamMember[];
  product_ids: string[];
  styling_notes: string | null;
}): Promise<void> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('content_tasks')
    .update({
      name: data.name.trim(),
      filming_date: data.filming_date || null,
      post_date: data.post_date || null,
      team_member_tags: data.team_member_tags,
      filming_team: data.filming_team,
      editing_team: data.editing_team,
      product_ids: data.product_ids,
      styling_notes: data.styling_notes || null,
    })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/content');
}

export async function deleteContentTask(id: string): Promise<void> {
  const supabase = await requireAdmin();
  await supabase.from('content_tasks').delete().eq('id', id);
  revalidatePath('/admin/content');
}

// ─── Deliverables ─────────────────────────────────────────────────────────────────────────────

export async function upsertDeliverables(
  taskId: string,
  deliverables: Array<{
    id?: string;
    deliverable_type: DeliverableType;
    reference_url: string | null;
    product_ids: string[];
    asset_paths: string[];
    filming_team: TeamMember[];
    editing_team: TeamMember[];
    position: number;
  }>
): Promise<void> {
  const supabase = await requireAdmin();

  // Delete all existing deliverables for this task and re-insert
  await supabase.from('content_deliverables').delete().eq('task_id', taskId);

  if (deliverables.length > 0) {
    const rows = deliverables.map((d, i) => ({
      task_id: taskId,
      deliverable_type: d.deliverable_type,
      reference_url: d.reference_url || null,
      product_ids: d.product_ids,
      asset_paths: d.asset_paths,
      filming_team: d.filming_team,
      editing_team: d.editing_team,
      position: i,
    }));
    const { error } = await supabase.from('content_deliverables').insert(rows);
    if (error) throw error;
  }

  revalidatePath('/admin/content');
}

// ─── Asset upload for deliverables ───────────────────────────────────────────────────────────────────────────

export async function getSignedContentAssetUploadUrl(
  taskId: string,
  filename: string
): Promise<{ signedUrl: string; path: string }> {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const ext = filename.split('.').pop() ?? 'bin';
  const path = `${taskId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await serviceClient.storage
    .from('content-assets')
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { signedUrl: data.signedUrl, path };
}

export async function getContentAssetPublicUrl(path: string): Promise<string> {
  const serviceClient = createServiceClient();
  const { data: { publicUrl } } = serviceClient.storage
    .from('content-assets')
    .getPublicUrl(path);
  return publicUrl;
}

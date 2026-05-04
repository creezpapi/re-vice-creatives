'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function updateCreative(id: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const notes = (formData.get('notes') as string) || null;
  const status = formData.get('status') as 'draft' | 'active' | 'archived';

  if (!title) return;

  const supabase = await createClient();
  await supabase.from('creatives').update({ title, notes, status }).eq('id', id);
  revalidatePath('/admin/creatives/' + id);
  revalidatePath('/admin');
}

export async function uploadAsset(id: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || !file.size) return;

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const ext = file.name.split('.').pop() || 'bin';
  const path = id + '/' + Date.now() + '.' + ext;
  const assetType = file.type.startsWith('video/') ? 'video' : 'image';

  const { error } = await serviceClient.storage.from('creatives').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) return;

  const { data: { publicUrl } } = serviceClient.storage.from('creatives').getPublicUrl(path);

  await supabase.from('creatives').update({
    asset_type: assetType,
    asset_url: publicUrl,
    asset_path: path,
    thumb_url: assetType === 'image' ? publicUrl : null,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
}

export async function removeAsset(id: string, assetPath: string) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  await serviceClient.storage.from('creatives').remove([assetPath]);
  await supabase.from('creatives').update({
    asset_type: null,
    asset_url: null,
    asset_path: null,
    thumb_url: null,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
}

export async function tagProducts(creativeId: string, selections: {
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  isManual: boolean;
  snapshotTitle: string;
  snapshotImageUrl: string | null;
  snapshotHandle: string | null;
  snapshotSku: string | null;
  snapshotVariantTitle: string | null;
}[]) {
  const supabase = await createClient();

  // Get existing attached products to avoid duplicates
  const { data: existing } = await supabase
    .from('creative_products')
    .select('shopify_product_id')
    .eq('creative_id', creativeId);

  const existingProductIds = new Set((existing || []).map(e => e.shopify_product_id).filter(Boolean));

  const toInsert = selections
    .filter(s => !s.shopifyProductId || !existingProductIds.has(s.shopifyProductId))
    .map((s, i) => ({
      creative_id: creativeId,
      shopify_product_id: s.shopifyProductId,
      shopify_variant_id: s.shopifyVariantId,
      is_manual: s.isManual,
      snapshot_title: s.snapshotTitle,
      snapshot_image_url: s.snapshotImageUrl,
      snapshot_handle: s.snapshotHandle,
      snapshot_sku: s.snapshotSku,
      snapshot_variant_title: s.snapshotVariantTitle,
      position: (existing?.length || 0) + i,
    }));

  if (toInsert.length > 0) {
    await supabase.from('creative_products').insert(toInsert);
  }

  revalidatePath('/admin/creatives/' + creativeId);
}

export async function untagProduct(creativeProductId: string, creativeId: string) {
  const supabase = await createClient();
  await supabase.from('creative_products').delete().eq('id', creativeProductId);
  revalidatePath('/admin/creatives/' + creativeId);
}

export async function deleteCreativeAndRedirect(id: string, assetPath: string | null) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  if (assetPath) {
    await serviceClient.storage.from('creatives').remove([assetPath]);
  }

  await supabase.from('creatives').delete().eq('id', id);
  revalidatePath('/admin');
  redirect('/admin');
}

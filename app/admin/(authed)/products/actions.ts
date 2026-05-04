'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email!)
    .single();
  if (!adminRow) throw new Error('Not admin');
  return user;
}

export async function getSignedProductImageUploadUrl(productId: string, filename: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const ext = filename.split('.').pop() ?? 'jpg';
  const path = `${productId}/image.${ext}`;
  const { data, error } = await serviceClient.storage
    .from('products')
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { signedUrl: data.signedUrl, path };
}

export async function saveProductImageRecord(id: string, path: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data: { publicUrl } } = serviceClient.storage
    .from('products')
    .getPublicUrl(path);
  const { error } = await serviceClient
    .from('manual_products')
    .update({ image_url: publicUrl, image_path: path, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/products');
  return { publicUrl };
}

export async function createManualProduct(name: string, productLink: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('manual_products')
    .insert({ name: name.trim(), product_link: productLink.trim() || null })
    .select('id')
    .single();
  if (error) throw error;
  revalidatePath('/admin/products');
  return { id: data.id };
}

export async function deleteManualProduct(id: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  // Delete image from storage if exists
  const { data: product } = await serviceClient
    .from('manual_products')
    .select('image_path')
    .eq('id', id)
    .single();
  if (product?.image_path) {
    await serviceClient.storage.from('products').remove([product.image_path]);
  }
  const { error } = await serviceClient
    .from('manual_products')
    .delete()
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/products');
  return { ok: true };
}

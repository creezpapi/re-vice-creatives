'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCreative(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  if (!title) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('creatives')
    .insert({ title, status: 'ready_to_launch' })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/admin');
  redirect('/admin/creatives/' + data.id);
}

export async function deleteCreative(id: string) {
  const supabase = await createClient();
  await supabase.from('creatives').delete().eq('id', id);
  revalidatePath('/admin');
  redirect('/admin');
}

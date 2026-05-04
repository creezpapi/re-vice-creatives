'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '/admin';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/admin/login?error=invalid-credentials');
  }

  // Verify admin allowlist
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .single();

  if (!adminRow) {
    await supabase.auth.signOut();
    redirect('/admin/login?error=not-admin');
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

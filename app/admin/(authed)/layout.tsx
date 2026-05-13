import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '../login/actions';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-rv-gray px-4 py-4">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-base font-semibold tracking-tight">
              re-vice creatives
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/admin" className="text-black hover:opacity-60 transition-all duration-250">Creatives</Link>
              <Link href="/admin/products" className="text-black hover:opacity-60 transition-all duration-250">Product library</Link>
              <Link href="/admin/content" className="text-black hover:opacity-60 transition-all duration-250">Content creation</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-rv-tab-inactive hover:text-black transition-all duration-250">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-screen-lg mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

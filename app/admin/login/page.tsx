'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from './actions';

function LoginForm() {
  const params = useSearchParams();
  const error = params.get('error');
  const next = params.get('next') || '/admin';

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-medium mb-8 tracking-tight">re-vice creatives</h1>

      {error === 'invalid-credentials' && (
        <p className="text-sm text-red-600 mb-4">Invalid email or password.</p>
      )}
      {error === 'not-admin' && (
        <p className="text-sm text-red-600 mb-4">Your account is not authorized to access this tool.</p>
      )}

      <form action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full h-11 px-4 border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250 text-sm"
            placeholder="you@re-vice.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full h-11 px-4 border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250 text-sm"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full h-11 bg-black text-white rounded-full text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

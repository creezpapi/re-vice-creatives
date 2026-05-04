'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncShopifyProducts } from '@/app/admin/(authed)/products/actions';

export default function SyncShopifyButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const r = await syncShopifyProducts();
      setResult('Synced ' + r.synced + (r.mocked ? ' (mock)' : ''));
    } catch (e) {
      setResult('Error: ' + (e as Error).message);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-xs text-rv-tab-inactive">{result}</span>}
      <button
        onClick={handleSync}
        disabled={loading}
        className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50"
      >
        <RefreshCw size={14} strokeWidth={1.6} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Syncing...' : 'Sync products from Shopify'}
      </button>
    </div>
  );
}

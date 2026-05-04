import { createClient } from '@/lib/supabase/server';
import { isShopifyConfigured } from '@/lib/shopify/storefront';
import SyncShopifyButton from '@/components/admin/SyncShopifyButton';
import ProductLibraryFilters from '@/components/admin/ProductLibraryFilters';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    available?: string;
  }>;
};

export default async function ProductLibraryPage({ searchParams }: Props) {
  const { q, type, available } = await searchParams;
  const supabase = await createClient();
  const mocked = !isShopifyConfigured();

  // Get product types for filter
  const { data: allProducts } = await supabase
    .from('shopify_products')
    .select('id, handle, title, product_type, available, image_url, online_store_url, last_synced_at')
    .order('title');

  const lastSynced = allProducts && allProducts.length > 0
    ? allProducts[0].last_synced_at
    : null;

  // Filter
  let filtered = allProducts || [];
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(lower) || p.handle.toLowerCase().includes(lower)
    );
  }
  if (type) filtered = filtered.filter((p) => p.product_type === type);
  if (available === 'true') filtered = filtered.filter((p) => p.available);
  if (available === 'false') filtered = filtered.filter((p) => !p.available);

  const productTypes = Array.from(new Set((allProducts || []).map((p) => p.product_type).filter(Boolean))).sort();

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">Product library</h1>
          <span className="text-sm text-rv-tab-inactive">
            {allProducts?.length || 0} synced
            {lastSynced && ' · last sync ' + timeAgo(lastSynced)}
            {mocked && ' · mock mode'}
          </span>
        </div>
        <SyncShopifyButton />
      </div>

      <div className="mt-6">
        <ProductLibraryFilters
          productTypes={productTypes as string[]}
          initialQ={q || ''}
          initialType={type || ''}
          initialAvailable={available || ''}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
        {filtered.map((product) => (
          <div key={product.id} className="bg-rv-gray">
            <div className="aspect-[4/5] bg-white">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-rv-gray" />
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{product.title}</p>
                {product.online_store_url && (
                  <a
                    href={product.online_store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-rv-tab-inactive hover:text-black transition-all duration-250"
                  >
                    <ExternalLink size={14} strokeWidth={1.6} />
                  </a>
                )}
              </div>
              <p className="text-xs text-rv-tab-inactive mt-0.5">{product.handle}</p>
              {product.product_type && (
                <p className="text-xs text-rv-tab-inactive">{product.product_type}</p>
              )}
              <p className="text-xs mt-1">
                <span className={product.available ? 'text-black' : 'text-rv-tab-inactive'}>
                  {product.available ? 'Available' : 'Unavailable'}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-rv-tab-inactive text-sm">
          {allProducts?.length === 0
            ? 'No products synced yet. Click \u201cSync products from Shopify\u201d to import your catalog.'
            : 'No products match your filters.'}
        </div>
      )}
    </div>
  );
}

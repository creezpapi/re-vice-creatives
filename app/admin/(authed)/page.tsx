import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import NewCreativeButton from '@/components/admin/NewCreativeButton';
import StatusTabs from '@/components/admin/StatusTabs';
import { PLATFORMS } from '@/lib/types';

type Props = {
  searchParams: Promise<{ status?: string; platform?: string; product?: string }>;
};

export default async function CreativesDashboard({ searchParams }: Props) {
  const { status, platform, product } = await searchParams;
  const supabase = await createClient();

  // Counts for status tabs
  const [allRes, rtlRes, activeRes, archivedRes] = await Promise.all([
    supabase.from('creatives').select('id', { count: 'exact', head: true }),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'ready_to_launch'),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
  ]);
  const counts = {
    all: allRes.count || 0,
    ready_to_launch: rtlRes.count || 0,
    active: activeRes.count || 0,
    archived: archivedRes.count || 0,
  };

  // Build base query
  let query = supabase
    .from('creatives')
    .select('id, title, status, thumb_url, platforms, created_at')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status as 'ready_to_launch' | 'active' | 'archived');
  }
  if (platform) {
    query = query.contains('platforms', [platform]);
  }

  const { data: allCreatives } = await query;

  // If filtering by product, get creative IDs that have that product
  let filteredIds: string[] | null = null;
  if (product) {
    const { data: cp } = await supabase
      .from('creative_products')
      .select('creative_id')
      .or(`shopify_product_id.eq.${product},snapshot_title.ilike.%${product}%`);
    filteredIds = (cp || []).map((r) => r.creative_id);
  }

  const creatives = filteredIds
    ? (allCreatives || []).filter((c) => filteredIds!.includes(c.id))
    : (allCreatives || []);

  // Product counts per creative
  const productCountMap: Record<string, number> = {};
  if (creatives.length > 0) {
    const { data: productCounts } = await supabase
      .from('creative_products')
      .select('creative_id')
      .in('creative_id', creatives.map((c) => c.id));
    if (productCounts) {
      for (const row of productCounts) {
        productCountMap[row.creative_id] = (productCountMap[row.creative_id] || 0) + 1;
      }
    }
  }

  // Product filter list (for dropdown)
  const { data: allProducts } = await supabase
    .from('shopify_products')
    .select('shopify_id, title')
    .order('title');

  const platformLabel = platform
    ? PLATFORMS.find((p) => p.key === platform)?.label
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">Creatives</h1>
          <span className="text-sm text-rv-tab-inactive">{counts.all}</span>
        </div>
        <NewCreativeButton />
      </div>

      <StatusTabs
        counts={counts}
        activeStatus={status || 'all'}
        activePlatform={platform}
        activeProduct={product}
      />

      {/* Product filter */}
      <div className="flex items-center gap-3 mt-4 mb-2">
        <span className="text-xs text-rv-tab-inactive">Filter by product:</span>
        <form method="GET" className="flex-1 max-w-xs">
          {status && <input type="hidden" name="status" value={status} />}
          {platform && <input type="hidden" name="platform" value={platform} />}
          <select
            name="product"
            defaultValue={product || ''}
            onChange={(e) => (e.target.form as HTMLFormElement).submit()}
            className="w-full h-8 px-3 text-xs border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250"
          >
            <option value="">All products</option>
            {(allProducts || []).map((p) => (
              <option key={p.shopify_id} value={p.shopify_id}>{p.title}</option>
            ))}
          </select>
        </form>
        {(platform || product || (status && status !== 'all')) && (
          <Link
            href="/admin"
            className="text-xs text-rv-tab-inactive hover:text-black transition-colors"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Active filters display */}
      {(platformLabel || product) && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {platformLabel && (
            <span className="h-6 px-3 rounded-full bg-black text-white text-xs flex items-center gap-1">
              {platformLabel}
            </span>
          )}
        </div>
      )}

      <div className="mt-2">
        {creatives.length === 0 ? (
          <div className="py-16 text-center text-rv-tab-inactive text-sm">
            No creatives match these filters.
          </div>
        ) : (
          <ul>
            {creatives.map((creative) => (
              <li key={creative.id}>
                <Link
                  href={'/admin/creatives/' + creative.id}
                  className="flex items-center gap-4 py-4 border-b border-rv-gray hover:opacity-70 transition-all duration-250 group"
                >
                  <div className="w-16 h-16 bg-rv-gray flex-shrink-0 overflow-hidden">
                    {creative.thumb_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creative.thumb_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-rv-gray" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{creative.title}</p>
                    <p className="text-xs text-rv-tab-inactive mt-0.5">
                      {productCountMap[creative.id] || 0} products
                      {' · '}
                      {creative.status === 'ready_to_launch' ? 'Ready to Launch' : creative.status}
                    </p>
                    {creative.platforms && creative.platforms.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {creative.platforms.map((pk: string) => {
                          const pl = PLATFORMS.find((p) => p.key === pk);
                          return (
                            <span key={pk} className="h-5 px-2 rounded-full bg-rv-gray text-rv-tab-inactive text-xs flex items-center">
                              {pl?.label || pk}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

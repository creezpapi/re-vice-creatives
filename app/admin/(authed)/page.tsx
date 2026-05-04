import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import NewCreativeButton from '@/components/admin/NewCreativeButton';
import StatusTabs from '@/components/admin/StatusTabs';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function CreativesDashboard({ searchParams }: Props) {
  const { status } = await searchParams;
  const supabase = await createClient();

  // Get counts for each status
  const [allRes, draftRes, activeRes, archivedRes] = await Promise.all([
    supabase.from('creatives').select('id', { count: 'exact', head: true }),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
  ]);

  const counts = {
    all: allRes.count || 0,
    draft: draftRes.count || 0,
    active: activeRes.count || 0,
    archived: archivedRes.count || 0,
  };

  // Fetch creatives with product count
  let query = supabase
    .from('creatives')
    .select('id, title, status, thumb_url, created_at')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status as 'draft' | 'active' | 'archived');
  }

  const { data: creatives } = await query;

  // Get product counts per creative
  const productCountMap: Record<string, number> = {};
  if (creatives && creatives.length > 0) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">Creatives</h1>
          <span className="text-sm text-rv-tab-inactive">{counts.all}</span>
        </div>
        <NewCreativeButton />
      </div>

      <StatusTabs counts={counts} activeStatus={status || 'all'} />

      <div className="mt-4">
        {!creatives || creatives.length === 0 ? (
          <div className="py-16 text-center text-rv-tab-inactive text-sm">
            No creatives yet. Click &ldquo;+ New creative&rdquo; to add one.
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
                      {productCountMap[creative.id] || 0} products · {creative.status}
                    </p>
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

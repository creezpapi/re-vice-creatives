'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PLATFORMS } from '@/lib/types';

type Counts = {
  all: number;
  ready_to_launch: number;
  active: number;
  archived: number;
  whitelisting: number;
  top_performers: number;
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'ready_to_launch', label: 'Ready to Launch' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'whitelisting', label: 'Whitelisting' },
  { key: 'top_performers', label: 'Top Performers' },
];

export default function StatusTabs({
  counts,
  activeStatus,
  activePlatform,
  activeProduct,
}: {
  counts: Counts;
  activeStatus: string;
  activePlatform?: string;
  activeProduct?: string;
}) {
  const pathname = usePathname();

  function buildHref(newStatus: string, newPlatform?: string) {
    const params = new URLSearchParams();
    if (newStatus !== 'all') params.set('status', newStatus);
    if (newPlatform) params.set('platform', newPlatform);
    if (activeProduct) params.set('product', activeProduct);
    const qs = params.toString();
    return pathname + (qs ? '?' + qs : '');
  }

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap border-b border-rv-gray">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.key && !activePlatform;
          const count = counts[tab.key as keyof Counts];
          return (
            <Link
              key={tab.key}
              href={buildHref(tab.key)}
              className={
                'flex-shrink-0 text-center py-3 px-4 text-sm relative transition-all duration-250 ' +
                (isActive ? 'font-medium text-black' : 'text-rv-tab-inactive hover:text-black')
              }
            >
              {tab.label}
              {count > 0 && <span className="text-xs"> ({count})</span>}
              {isActive && <span className="absolute bottom-0 inset-x-[10%] h-[2px] bg-black" />}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 py-3 border-b border-rv-gray">
        <Link
          href={buildHref(activeStatus)}
          className={
            'h-7 px-3 rounded-full text-xs transition-all duration-250 ' +
            (!activePlatform ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')
          }
        >
          All platforms
        </Link>
        {PLATFORMS.map((p) => {
          const isActive = activePlatform === p.key;
          return (
            <Link
              key={p.key}
              href={buildHref(activeStatus, p.key)}
              className={
                'h-7 px-3 rounded-full text-xs transition-all duration-250 ' +
                (isActive ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')
              }
            >
              {p.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

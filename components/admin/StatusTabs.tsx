'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type Counts = { all: number; draft: number; active: number; archived: number };

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
];

export default function StatusTabs({ counts, activeStatus }: { counts: Counts; activeStatus: string }) {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-rv-gray">
      {TABS.map((tab) => {
        const isActive = activeStatus === tab.key;
        const href = tab.key === 'all' ? pathname : (pathname + '?status=' + tab.key);
        const count = counts[tab.key as keyof Counts];

        return (
          <Link
            key={tab.key}
            href={href}
            className={'flex-1 text-center py-3 text-sm relative transition-all duration-250 ' +
              (isActive ? 'font-medium text-black' : 'text-rv-tab-inactive hover:text-black')}
          >
            {tab.label} {count > 0 && <span className="text-xs">({count})</span>}
            {isActive && (
              <span className="absolute bottom-0 inset-x-[25%] h-[2px] bg-black" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

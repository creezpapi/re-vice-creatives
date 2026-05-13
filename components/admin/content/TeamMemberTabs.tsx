'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ContentTask, TeamMember } from '@/lib/types';
import { TEAM_MEMBERS } from '@/lib/types';

type Product = { id: string; name: string; image_url: string | null };

const ALL_TABS = ['All', ...TEAM_MEMBERS] as const;
type TabKey = typeof ALL_TABS[number];

type Props = {
  tasks: ContentTask[];
  products: Product[];
  onEditTask: (task: ContentTask) => void;
};

export default function TeamMemberTabs({ tasks, products, onEditTask }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('All');

  function getTasksForMember(member: TeamMember) {
    return tasks.filter(t =>
      t.team_member_tags.includes(member) ||
      t.filming_team.includes(member) ||
      t.editing_team.includes(member)
    );
  }

  function countForTab(tab: TabKey): number {
    if (tab === 'All') return tasks.length;
    return getTasksForMember(tab as TeamMember).length;
  }

  const filteredTasks = activeTab === 'All'
    ? [...tasks].sort((a, b) => {
        if (!a.filming_date && !b.filming_date) return 0;
        if (!a.filming_date) return 1;
        if (!b.filming_date) return -1;
        return b.filming_date.localeCompare(a.filming_date);
      })
    : getTasksForMember(activeTab as TeamMember);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  return (
    <div>
      {/* Tab row */}
      <div className="flex border-b border-rv-gray overflow-x-auto">
        {ALL_TABS.map(tab => {
          const count = countForTab(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                'flex-shrink-0 py-3 px-4 text-sm relative transition-all duration-250 ' +
                (isActive ? 'font-medium text-black' : 'text-rv-tab-inactive hover:text-black')
              }
            >
              {tab}{count > 0 && <span className="text-xs"> ({count})</span>}
              {isActive && <span className="absolute bottom-0 inset-x-[10%] h-[2px] bg-black" />}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="mt-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-rv-tab-inactive">No tasks found.</div>
        ) : (
          <ul>
            {filteredTasks.map(task => {
              const roleTags: string[] = [];
              if (activeTab !== 'All') {
                const m = activeTab as TeamMember;
                if (task.team_member_tags.includes(m)) roleTags.push('Tagged');
                if (task.filming_team.includes(m)) roleTags.push('Filming');
                if (task.editing_team.includes(m)) roleTags.push('Editing');
              }
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="w-full flex items-center gap-4 py-4 border-b border-rv-gray hover:opacity-70 transition-all duration-250 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.name}</p>
                      <p className="text-xs text-rv-tab-inactive mt-0.5">
                        {task.filming_date ? `Films ${task.filming_date}` : 'No filming date'}
                        {task.post_date ? ` · Posts ${task.post_date}` : ''}
                      </p>
                      {roleTags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {roleTags.map(r => (
                            <span key={r} className="h-5 px-2 rounded-full bg-rv-gray text-xs flex items-center text-rv-tab-inactive">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

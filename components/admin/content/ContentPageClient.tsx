'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { ContentTask, TeamMember } from '@/lib/types';
import { TEAM_MEMBERS } from '@/lib/types';
import TaskModal from './TaskModal';
import DayDetailModal from './DayDetailModal';
import TeamMemberTabs from './TeamMemberTabs';

type Product = { id: string; name: string; product_link: string | null; image_url: string | null };

type Props = {
  initialTasks: ContentTask[];
  products: Product[];
};

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ContentPageClient({ initialTasks, products }: Props) {
  const [tasks, setTasks] = useState<ContentTask[]>(initialTasks);
  const [today] = useState(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

  // ─── Calendar grid helpers ────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const days: Array<{ date: string; dayNum: number } | null> = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: formatDate(new Date(viewYear, viewMonth, d)), dayNum: d });
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, ContentTask[]> = {};
    for (const t of tasks) {
      if (t.filming_date) {
        if (!map[t.filming_date]) map[t.filming_date] = [];
        map[t.filming_date].push(t);
      }
    }
    return map;
  }, [tasks]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function refreshTasks(updated: ContentTask[]) {
    setTasks(updated);
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium tracking-tight">CONTENT CREATION</h1>
        <button
          onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
          className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70"
        >
          <Plus size={16} strokeWidth={1.6} />
          Add Task
        </button>
      </div>

      {/* ─── Block 1: Calendar ─── */}
      <div className="mb-10">
        {/* Calendar nav */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={prevMonth} className="h-8 w-8 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95">
            <ChevronLeft size={16} strokeWidth={1.6} />
          </button>
          <span className="text-base font-medium min-w-[160px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="h-8 w-8 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95">
            <ChevronRight size={16} strokeWidth={1.6} />
          </button>
          <button onClick={goToday} className="h-7 px-3 rounded-full bg-rv-gray text-xs font-medium hover:opacity-70 transition-all duration-250 active:scale-95">
            Today
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-rv-gray">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-2 text-center text-xs text-rv-tab-inactive font-medium">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, idx) => {
            if (!cell) return <div key={'empty-'+idx} className="min-h-[100px] border-b border-r border-rv-gray last:border-r-0" />;
            const dayTasks = tasksByDate[cell.date] || [];
            const visible = dayTasks.slice(0, 3);
            const overflow = dayTasks.length - 3;
            const isToday = cell.date === formatDate(today);
            return (
              <div
                key={cell.date}
                className="min-h-[100px] border-b border-r border-rv-gray last:border-r-0 p-1.5 cursor-pointer hover:bg-rv-gray transition-all duration-250"
                onClick={() => setDayModalDate(cell.date)}
              >
                <div className={
                  'text-xs font-medium w-6 h-6 flex items-center justify-center mb-1 ' +
                  (isToday ? 'rounded-full bg-black text-white' : 'text-rv-tab-inactive')
                }>
                  {cell.dayNum}
                </div>
                <div className="space-y-0.5">
                  {visible.map(t => (
                    <div key={t.id} className="h-5 px-1.5 rounded-full bg-rv-gray text-xs truncate flex items-center">
                      {t.name}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="h-5 px-1.5 rounded-full bg-black text-white text-xs flex items-center">
                      +{overflow} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Block 2: Team member tabs ─── */}
      <TeamMemberTabs
        tasks={tasks}
        products={products}
        onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
      />

      {/* Task create/edit modal */}
      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          products={products}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
          onSaved={(allTasks) => {
            setTasks(allTasks);
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Day detail modal */}
      {dayModalDate && (
        <DayDetailModal
          date={dayModalDate}
          tasks={tasksByDate[dayModalDate] || []}
          products={products}
          onClose={() => setDayModalDate(null)}
          onEditTask={(t) => { setDayModalDate(null); setEditingTask(t); setTaskModalOpen(true); }}
          onSaved={(allTasks) => setTasks(allTasks)}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import Modal from '@/components/common/Modal';
import type { ContentTask } from '@/lib/types';

type Product = { id: string; name: string; image_url: string | null };

type Props = {
  date: string;
  tasks: ContentTask[];
  products: Product[];
  onClose: () => void;
  onEditTask: (task: ContentTask) => void;
  onSaved: (allTasks: ContentTask[]) => void;
};

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DayDetailModal({ date, tasks, products, onClose, onEditTask }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  async function handleExportPdf() {
    setExporting(true);
    try {
      const res = await fetch(`/api/content/export-pdf?date=${date}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content-${date}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-5 pr-8">
        <h2 className="text-base font-medium">Tasks for {formatDateHeader(date)}</h2>
        <button
          onClick={handleExportPdf}
          disabled={exporting || tasks.length === 0}
          className="h-7 px-3 rounded-full bg-rv-gray text-xs flex items-center gap-1.5 hover:opacity-70 transition-all duration-250 disabled:opacity-40"
        >
          <FileDown size={12} strokeWidth={1.6} />
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 text-center text-sm text-rv-tab-inactive">No tasks on this day.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isExpanded = expandedId === task.id;
            return (
              <div key={task.id} className="border border-rv-gray rounded-2xl overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-rv-gray transition-all duration-250"
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={14} strokeWidth={1.6} /> : <ChevronRight size={14} strokeWidth={1.6} />}
                    <span className="text-sm font-medium">{task.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                    className="h-7 px-3 rounded-full bg-rv-gray text-xs hover:opacity-70 transition-all duration-250"
                  >
                    Edit
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-rv-gray space-y-3 pt-3">
                    <Row label="Filming date" value={task.filming_date ?? '—'} />
                    <Row label="Post date" value={task.post_date ?? '—'} />
                    {task.team_member_tags.length > 0 && (
                      <ChipRow label="Team" items={task.team_member_tags} />
                    )}
                    {task.filming_team.length > 0 && (
                      <ChipRow label="Filming team" items={task.filming_team} />
                    )}
                    {task.editing_team.length > 0 && (
                      <ChipRow label="Editing team" items={task.editing_team} />
                    )}
                    {task.product_ids.length > 0 && (
                      <ChipRow label="Products" items={task.product_ids.map(id => productMap[id]?.name ?? id)} />
                    )}
                    {task.styling_notes && (
                      <div>
                        <span className="text-xs text-rv-tab-inactive">Styling notes</span>
                        <p className="text-sm whitespace-pre-line mt-0.5">{task.styling_notes}</p>
                      </div>
                    )}
                    {task.deliverables && task.deliverables.length > 0 && (
                      <div>
                        <span className="text-xs text-rv-tab-inactive block mb-1.5">Deliverables ({task.deliverables.length})</span>
                        <div className="space-y-2">
                          {task.deliverables.map((d, i) => (
                            <div key={d.id ?? i} className="bg-rv-gray rounded-xl p-3">
                              <p className="text-xs font-medium">{d.deliverable_type}</p>
                              {d.reference_url && (
                                <a href={d.reference_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-rv-tab-inactive underline break-all">{d.reference_url}</a>
                              )}
                              {d.product_ids.length > 0 && (
                                <p className="text-xs text-rv-tab-inactive mt-0.5">
                                  Products: {d.product_ids.map(id => productMap[id]?.name ?? id).join(', ')}
                                </p>
                              )}
                              {d.asset_paths.length > 0 && (
                                <p className="text-xs text-rv-tab-inactive mt-0.5">
                                  Files: {d.asset_paths.map(p => p.split('/').pop()).join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-rv-tab-inactive">{label}: </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="text-xs text-rv-tab-inactive block mb-1">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map(i => (
          <span key={i} className="h-6 px-2.5 rounded-full bg-rv-gray text-xs flex items-center">{i}</span>
        ))}
      </div>
    </div>
  );
}

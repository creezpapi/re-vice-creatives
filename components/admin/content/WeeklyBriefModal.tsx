'use client';

import { useState, useCallback, useTransition } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, FileDown, Loader2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { getBriefForWeek, upsertBriefDay, getMondayOf } from '@/app/admin/(authed)/content/weekly-brief-actions';
import type { WeeklyBrief, WeeklyBriefDay, DeliverableType, TeamMember, WeekDayIndex } from '@/lib/types';
import { TEAM_MEMBERS, DELIVERABLE_TYPES, WEEK_DAY_LABELS } from '@/lib/types';

type Product = { id: string; name: string; image_url: string | null };

type DayState = {
  deliverable_types: DeliverableType[];
  team_members: TeamMember[];
  product_ids: string[];
  reference_url: string;
  notes: string;
};

function emptyDay(): DayState {
  return { deliverable_types: [], team_members: [], product_ids: [], reference_url: '', notes: '' };
}

function dayFromRow(d: WeeklyBriefDay): DayState {
  return {
    deliverable_types: (d.deliverable_types ?? []) as DeliverableType[],
    team_members: (d.team_members ?? []) as TeamMember[],
    product_ids: d.product_ids ?? [],
    reference_url: d.reference_url ?? '',
    notes: d.notes ?? '',
  };
}

// ─── Reusable multi-select (same style as TaskModal) ──────────────────────────

function MultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(o: T) {
    onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  }
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map(v => (
          <span key={v} className="h-7 px-2.5 rounded-full bg-black text-white text-xs flex items-center gap-1">
            {v}
            <button type="button" onClick={() => toggle(v)} className="hover:opacity-70">
              <X size={10} strokeWidth={2} />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="h-7 px-2.5 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-all duration-250">
          <Plus size={10} strokeWidth={2} /> Add
        </button>
      </div>
      {open && (
        <div className="border border-rv-gray rounded-2xl overflow-hidden mb-2 max-h-44 overflow-y-auto">
          {options.filter(o => !value.includes(o)).map(o => (
            <button key={o} type="button" onClick={() => toggle(o)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-rv-gray transition-all duration-250">
              {o}
            </button>
          ))}
          {options.filter(o => !value.includes(o)).length === 0 && (
            <div className="px-3 py-2 text-xs text-rv-tab-inactive">All selected</div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductMultiSelect({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  }
  const selected = products.filter(p => value.includes(p.id));
  const unselected = products.filter(p => !value.includes(p.id));
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">Products</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selected.map(p => (
          <span key={p.id} className="h-7 px-2.5 rounded-full bg-black text-white text-xs flex items-center gap-1">
            {p.name}
            <button type="button" onClick={() => toggle(p.id)} className="hover:opacity-70">
              <X size={10} strokeWidth={2} />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="h-7 px-2.5 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-all duration-250">
          <Plus size={10} strokeWidth={2} /> Add
        </button>
      </div>
      {open && products.length > 0 && (
        <div className="border border-rv-gray rounded-2xl overflow-hidden mb-2 max-h-44 overflow-y-auto">
          {unselected.map(p => (
            <button key={p.id} type="button" onClick={() => toggle(p.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-rv-gray transition-all duration-250 flex items-center gap-2">
              {p.image_url && <img src={p.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
              {p.name}
            </button>
          ))}
          {unselected.length === 0 && <div className="px-3 py-2 text-xs text-rv-tab-inactive">All products added</div>}
        </div>
      )}
    </div>
  );
}

// ─── Week helpers ──────────────────────────────────────────────────────────────

function formatWeekLabel(monday: string) {
  const d = new Date(monday + 'T00:00:00');
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(d)} – ${fmt(end)}, ${end.getFullYear()}`;
}

function shiftWeek(monday: string, delta: number): string {
  const d = new Date(monday + 'T00:00:00');
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

// ─── Main modal ───────────────────────────────────────────────────────────────

type Props = {
  products: Product[];
  onClose: () => void;
};

export default function WeeklyBriefModal({ products, onClose }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [brief, setBrief] = useState<WeeklyBrief | null>(null);
  const [activeDay, setActiveDay] = useState<WeekDayIndex>(0);
  const [dayStates, setDayStates] = useState<Record<number, DayState>>({});
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load brief whenever weekStart changes
  const loadWeek = useCallback(async (week: string) => {
    setLoadingWeek(true);
    setSaveError(null);
    try {
      const b = await getBriefForWeek(week);
      setBrief(b);
      // Seed day states from DB
      const states: Record<number, DayState> = {};
      for (let i = 0; i < 7; i++) {
        const row = (b.days ?? []).find(d => d.day_index === i);
        states[i] = row ? dayFromRow(row) : emptyDay();
      }
      setDayStates(states);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  // Load on mount
  useState(() => { loadWeek(weekStart); });

  function navigateWeek(delta: number) {
    const newWeek = shiftWeek(weekStart, delta);
    setWeekStart(newWeek);
    loadWeek(newWeek);
  }

  function updateDay(patch: Partial<DayState>) {
    setDayStates(prev => ({ ...prev, [activeDay]: { ...(prev[activeDay] ?? emptyDay()), ...patch } }));
  }

  async function saveDay() {
    const state = dayStates[activeDay] ?? emptyDay();
    setSaving(true);
    setSaveError(null);
    try {
      await upsertBriefDay(weekStart, activeDay as WeekDayIndex, {
        deliverable_types: state.deliverable_types,
        team_members: state.team_members,
        product_ids: state.product_ids,
        reference_url: state.reference_url || null,
        notes: state.notes || null,
      });
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleExportPdf() {
    setExporting(true);
    window.open(`/api/content/weekly-brief-pdf?week=${weekStart}`, '_blank');
    setTimeout(() => setExporting(false), 1500);
  }

  const day = dayStates[activeDay] ?? emptyDay();

  return (
    <Modal onClose={onClose} wide>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 pr-8">
        <h2 className="text-lg font-medium">Weekly Brief</h2>
        <button
          onClick={handleExportPdf}
          disabled={exporting || loadingWeek}
          className="h-7 px-3 rounded-full bg-rv-gray text-xs flex items-center gap-1.5 hover:opacity-70 transition-all duration-250 disabled:opacity-40"
        >
          <FileDown size={12} strokeWidth={1.6} />
          {exporting ? 'Opening...' : 'Export PDF'}
        </button>
      </div>

      {/* ── Week picker ── */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigateWeek(-1)}
          className="h-8 w-8 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95">
          <ChevronLeft size={15} strokeWidth={1.6} />
        </button>
        <span className="text-sm font-medium min-w-[200px] text-center">{formatWeekLabel(weekStart)}</span>
        <button onClick={() => navigateWeek(1)}
          className="h-8 w-8 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95">
          <ChevronRight size={15} strokeWidth={1.6} />
        </button>
        <button
          onClick={() => { const m = getMondayOf(new Date()); setWeekStart(m); loadWeek(m); }}
          className="h-7 px-3 rounded-full bg-rv-gray text-xs font-medium hover:opacity-70 transition-all duration-250 active:scale-95">
          This week
        </button>
      </div>

      {/* ── Day tabs ── */}
      <div className="flex gap-1 mb-5 border-b border-rv-gray pb-0">
        {WEEK_DAY_LABELS.map((label, i) => {
          const st = dayStates[i] ?? emptyDay();
          const hasData = st.deliverable_types.length > 0 || st.team_members.length > 0 || st.product_ids.length > 0 || st.reference_url || st.notes;
          return (
            <button
              key={i}
              onClick={() => setActiveDay(i as WeekDayIndex)}
              className={
                'relative h-9 px-4 rounded-t-xl text-xs font-medium transition-all duration-250 ' +
                (activeDay === i ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:opacity-70')
              }
            >
              {label}
              {hasData && activeDay !== i && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-black" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Day form ── */}
      {loadingWeek ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} strokeWidth={1.6} className="animate-spin text-rv-tab-inactive" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Field 1: Deliverable types */}
          <MultiSelect<DeliverableType>
            label="Deliverable types"
            options={DELIVERABLE_TYPES}
            value={day.deliverable_types}
            onChange={v => updateDay({ deliverable_types: v })}
          />

          {/* Field 2: Team members */}
          <MultiSelect<TeamMember>
            label="Team members"
            options={TEAM_MEMBERS}
            value={day.team_members}
            onChange={v => updateDay({ team_members: v })}
          />

          {/* Field 3: Products */}
          <ProductMultiSelect
            products={products}
            value={day.product_ids}
            onChange={v => updateDay({ product_ids: v })}
          />

          {/* Field 4: Reference link */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Reference link</label>
            <input
              type="url"
              value={day.reference_url}
              onChange={e => updateDay({ reference_url: e.target.value })}
              placeholder="https://..."
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
            />
          </div>

          {/* Field 5: Notes */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Notes</label>
            <textarea
              value={day.notes}
              onChange={e => updateDay({ notes: e.target.value })}
              rows={3}
              placeholder="Any notes for this day..."
              className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none"
            />
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-rv-gray">
            <button type="button" onClick={onClose}
              className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250 hover:opacity-70">
              Close
            </button>
            <button type="button" onClick={saveDay} disabled={saving}
              className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium flex items-center gap-2 transition-all duration-250 active:scale-95 disabled:opacity-40">
              {saving && <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save day'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, FileDown, Loader2, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { getBriefForWeek, upsertBriefDay } from '@/app/admin/(authed)/content/weekly-brief-actions';
import type {
  WeeklyBrief, WeeklyBriefDay, DeliverableType, TeamMember,
  WeekDayIndex, ProductCategory, DeliverableItem,
} from '@/lib/types';
import {
  TEAM_MEMBERS, DELIVERABLE_TYPES, WEEK_DAY_LABELS,
  PRODUCT_CATEGORIES,
} from '@/lib/types';

type Product = { id: string; name: string; image_url: string | null };

type DayState = {
  product_category: ProductCategory[];
  deliverable_items: DeliverableItem[];
  product_ids: string[];
  notes: string;
};

function emptyDay(): DayState {
  return { product_category: [], deliverable_items: [], product_ids: [], notes: '' };
}

function emptyItem(): DeliverableItem {
  return { type: DELIVERABLE_TYPES[0], team_members: [], reference_url: null };
}

function dayFromRow(d: WeeklyBriefDay): DayState {
  return {
    product_category: (d.product_category ?? []) as ProductCategory[],
    deliverable_items: (d.deliverable_items ?? []) as DeliverableItem[],
    product_ids: d.product_ids ?? [],
    notes: d.notes ?? '',
  };
}

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

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
      {label && <label className="block text-xs font-medium mb-1.5">{label}</label>}
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
      <label className="block text-xs font-medium mb-1.5">Products from library</label>
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

function DeliverableItemRow({
  item,
  index,
  total,
  onChange,
  onRemove,
}: {
  item: DeliverableItem;
  index: number;
  total: number;
  onChange: (patch: Partial<DeliverableItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rv-gray p-4 space-y-3 relative">
      <div className="flex items-center gap-2">
        <select
          value={item.type}
          onChange={e => onChange({ type: e.target.value as DeliverableType })}
          className="flex-1 h-8 px-2 text-xs border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 bg-white"
        >
          {DELIVERABLE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {total > 1 && (
          <button type="button" onClick={onRemove}
            className="h-7 w-7 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 flex-shrink-0">
            <Trash2 size={12} strokeWidth={1.6} />
          </button>
        )}
      </div>
      <MultiSelect<TeamMember>
        label="Team members"
        options={TEAM_MEMBERS}
        value={item.team_members as TeamMember[]}
        onChange={v => onChange({ team_members: v })}
      />
      <div>
        <label className="block text-xs font-medium mb-1.5">Reference link</label>
        <input
          type="url"
          value={item.reference_url ?? ''}
          onChange={e => onChange({ reference_url: e.target.value || null })}
          placeholder="https://..."
          className="w-full h-8 px-3 text-xs border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
        />
      </div>
    </div>
  );
}

function formatWeekLabel(monday: string) {
  const d = new Date(monday + 'T00:00:00');
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return fmt(d) + ' – ' + fmt(end) + ', ' + end.getFullYear();
}

function shiftWeek(monday: string, delta: number): string {
  const d = new Date(monday + 'T00:00:00');
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

type Props = {
  products: Product[];
  onClose: () => void;
};

export default function WeeklyBriefModal({ products, onClose }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [activeDay, setActiveDay] = useState<WeekDayIndex>(0);
  const [dayStates, setDayStates] = useState<Record<number, DayState>>({});
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadWeek = useCallback(async (week: string) => {
    setLoadingWeek(true);
    setSaveError(null);
    try {
      const b = await getBriefForWeek(week);
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

  if (!initialized) {
    setInitialized(true);
    loadWeek(weekStart);
  }

  function navigateWeek(delta: number) {
    const newWeek = shiftWeek(weekStart, delta);
    setWeekStart(newWeek);
    setActiveDay(0);
    loadWeek(newWeek);
  }

  function goThisWeek() {
    const m = getMondayOf(new Date());
    setWeekStart(m);
    setActiveDay(0);
    loadWeek(m);
  }

  function updateDay(patch: Partial<DayState>) {
    setDayStates(prev => ({ ...prev, [activeDay]: { ...(prev[activeDay] ?? emptyDay()), ...patch } }));
  }

  function updateItem(index: number, patch: Partial<DeliverableItem>) {
    const day = dayStates[activeDay] ?? emptyDay();
    const items = [...day.deliverable_items];
    items[index] = { ...items[index], ...patch };
    updateDay({ deliverable_items: items });
  }

  function addItem() {
    const day = dayStates[activeDay] ?? emptyDay();
    updateDay({ deliverable_items: [...day.deliverable_items, emptyItem()] });
  }

  function removeItem(index: number) {
    const day = dayStates[activeDay] ?? emptyDay();
    updateDay({ deliverable_items: day.deliverable_items.filter((_, i) => i !== index) });
  }

  async function saveDay() {
    const state = dayStates[activeDay] ?? emptyDay();
    setSaving(true);
    setSaveError(null);
    try {
      await upsertBriefDay(weekStart, activeDay as WeekDayIndex, {
        product_category: state.product_category,
        deliverable_items: state.deliverable_items,
        product_ids: state.product_ids,
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
    window.open('/api/content/weekly-brief-pdf?week=' + weekStart, '_blank');
    setTimeout(() => setExporting(false), 1500);
  }

  const day = dayStates[activeDay] ?? emptyDay();

  return (
    <Modal onClose={onClose} wide>
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
        <button onClick={goThisWeek}
          className="h-7 px-3 rounded-full bg-rv-gray text-xs font-medium hover:opacity-70 transition-all duration-250 active:scale-95">
          This week
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-rv-gray">
        {WEEK_DAY_LABELS.map((label, i) => {
          const st = dayStates[i] ?? emptyDay();
          const hasData = st.product_category.length > 0 || st.deliverable_items.length > 0 || st.product_ids.length > 0 || st.notes;
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

      {loadingWeek ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} strokeWidth={1.6} className="animate-spin text-rv-tab-inactive" />
        </div>
      ) : (
        <div className="space-y-5">
          <MultiSelect<ProductCategory>
            label="Product categories"
            options={PRODUCT_CATEGORIES}
            value={day.product_category}
            onChange={v => updateDay({ product_category: v })}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Deliverables</label>
              <button type="button" onClick={addItem}
                className="h-7 px-2.5 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-all duration-250">
                <Plus size={10} strokeWidth={2} /> Add deliverable
              </button>
            </div>
            {day.deliverable_items.length === 0 ? (
              <p className="text-xs text-rv-tab-inactive py-2">No deliverables yet. Click &quot;Add deliverable&quot; to get started.</p>
            ) : (
              <div className="space-y-3">
                {day.deliverable_items.map((item, idx) => (
                  <DeliverableItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    total={day.deliverable_items.length}
                    onChange={patch => updateItem(idx, patch)}
                    onRemove={() => removeItem(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <ProductMultiSelect
            products={products}
            value={day.product_ids}
            onChange={v => updateDay({ product_ids: v })}
          />

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

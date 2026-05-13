'use client';

import { useState, useRef } from 'react';
import { X, Plus, Loader2, Upload } from 'lucide-react';
import Modal from '@/components/common/Modal';
import {
  createContentTask,
  updateContentTask,
  upsertDeliverables,
  getSignedContentAssetUploadUrl,
} from '@/app/admin/(authed)/content/actions';
import type { ContentTask, DeliverableType, TeamMember } from '@/lib/types';
import { TEAM_MEMBERS, DELIVERABLE_TYPES } from '@/lib/types';

type Product = { id: string; name: string; image_url: string | null };

type DeliverableState = {
  key: string;
  deliverable_type: DeliverableType;
  reference_url: string;
  product_ids: string[];
  asset_paths: string[];
  asset_previews: string[];
};

type Props = {
  task: ContentTask | null;
  products: Product[];
  onClose: () => void;
  onSaved: (allTasks: ContentTask[]) => void;
};

function uid() { return Math.random().toString(36).slice(2); }

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(o: string) {
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
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-7 px-2.5 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-all duration-250"
        >
          <Plus size={10} strokeWidth={2} />
          Add
        </button>
      </div>
      {open && (
        <div className="border border-rv-gray rounded-2xl overflow-hidden mb-2">
          {options.filter(o => !value.includes(o)).map(o => (
            <button
              key={o}
              type="button"
              onClick={() => { toggle(o); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-rv-gray transition-all duration-250"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductMultiSelect({
  label,
  products,
  value,
  onChange,
}: {
  label: string;
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
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selected.map(p => (
          <span key={p.id} className="h-7 px-2.5 rounded-full bg-black text-white text-xs flex items-center gap-1">
            {p.name}
            <button type="button" onClick={() => toggle(p.id)} className="hover:opacity-70">
              <X size={10} strokeWidth={2} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-7 px-2.5 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-all duration-250"
        >
          <Plus size={10} strokeWidth={2} />
          Add
        </button>
      </div>
      {open && products.length > 0 && (
        <div className="border border-rv-gray rounded-2xl overflow-hidden mb-2 max-h-48 overflow-y-auto">
          {unselected.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-rv-gray transition-all duration-250 flex items-center gap-2"
            >
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

export default function TaskModal({ task, products, onClose, onSaved }: Props) {
  const [name, setName] = useState(task?.name ?? '');
  const [filmingDate, setFilmingDate] = useState(task?.filming_date ?? '');
  const [postDate, setPostDate] = useState(task?.post_date ?? '');
  const [teamMemberTags, setTeamMemberTags] = useState<TeamMember[]>(task?.team_member_tags ?? []);
  const [filmingTeam, setFilmingTeam] = useState<TeamMember[]>(task?.filming_team ?? []);
  const [editingTeam, setEditingTeam] = useState<TeamMember[]>(task?.editing_team ?? []);
  const [productIds, setProductIds] = useState<string[]>(task?.product_ids ?? []);
  const [stylingNotes, setStylingNotes] = useState(task?.styling_notes ?? '');
  const [deliverables, setDeliverables] = useState<DeliverableState[]>(
    task?.deliverables?.map(d => ({
      key: uid(),
      deliverable_type: d.deliverable_type as DeliverableType,
      reference_url: d.reference_url ?? '',
      product_ids: d.product_ids,
      asset_paths: d.asset_paths,
      asset_previews: [],
    })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function addDeliverable() {
    setDeliverables(prev => [...prev, {
      key: uid(),
      deliverable_type: 'Tiktok Trend',
      reference_url: '',
      product_ids: [],
      asset_paths: [],
      asset_previews: [],
    }]);
  }

  function removeDeliverable(key: string) {
    setDeliverables(prev => prev.filter(d => d.key !== key));
  }

  function updateDeliverable(key: string, patch: Partial<DeliverableState>) {
    setDeliverables(prev => prev.map(d => d.key === key ? { ...d, ...patch } : d));
  }

  async function handleAssetUpload(key: string, files: FileList) {
    const paths: string[] = [];
    const previews: string[] = [];
    for (const file of Array.from(files)) {
      const { signedUrl, path } = await getSignedContentAssetUploadUrl(task?.id ?? 'new', file.name);
      const res = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (res.ok) {
        paths.push(path);
        previews.push(URL.createObjectURL(file));
      }
    }
    updateDeliverable(key, {
      asset_paths: [...(deliverables.find(d => d.key === key)?.asset_paths ?? []), ...paths],
      asset_previews: [...(deliverables.find(d => d.key === key)?.asset_previews ?? []), ...previews],
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Task name is required'); return; }
    setLoading(true);
    setError(null);
    try {
      let taskId = task?.id;
      const payload = {
        name: name.trim(),
        filming_date: filmingDate || null,
        post_date: postDate || null,
        team_member_tags: teamMemberTags,
        filming_team: filmingTeam,
        editing_team: editingTeam,
        product_ids: productIds,
        styling_notes: stylingNotes || null,
      };
      if (task) {
        await updateContentTask(task.id, payload);
      } else {
        const { id } = await createContentTask(payload);
        taskId = id;
      }
      await upsertDeliverables(taskId!, deliverables.map((d, i) => ({
        deliverable_type: d.deliverable_type,
        reference_url: d.reference_url || null,
        product_ids: d.product_ids,
        asset_paths: d.asset_paths,
        position: i,
      })));
      // Refresh tasks by fetching from server via a simple reload signal
      const res = await fetch('/api/admin/content/tasks');
      const { tasks: allTasks } = await res.json();
      onSaved(allTasks);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <Modal onClose={onClose} wide>
      <h2 className="text-lg font-medium mb-5 pr-8">{task ? 'Edit task' : 'New task'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Task name */}
        <div>
          <label className="block text-xs font-medium mb-1.5">Task name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Spring lookbook shoot"
            className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
            disabled={loading}
          />
        </div>

        {/* Team member tags */}
        <MultiSelect label="Team member tags" options={TEAM_MEMBERS} value={teamMemberTags} onChange={v => setTeamMemberTags(v as TeamMember[])} />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">Filming date</label>
            <input type="date" value={filmingDate} onChange={e => setFilmingDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Post date</label>
            <input type="date" value={postDate} onChange={e => setPostDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Deliverables</span>
            <button type="button" onClick={addDeliverable}
              className="h-7 px-2.5 rounded-full bg-rv-gray text-xs flex items-center gap-1 hover:opacity-70 transition-all duration-250">
              <Plus size={10} strokeWidth={2} />Add deliverable
            </button>
          </div>
          <div className="space-y-3">
            {deliverables.map((d) => (
              <div key={d.key} className="bg-rv-gray rounded-2xl p-4 relative">
                <button type="button" onClick={() => removeDeliverable(d.key)}
                  className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white flex items-center justify-center hover:opacity-70">
                  <X size={12} strokeWidth={1.6} />
                </button>
                <div className="space-y-3 pr-6">
                  <div>
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select
                      value={d.deliverable_type}
                      onChange={e => updateDeliverable(d.key, { deliverable_type: e.target.value as DeliverableType })}
                      className="w-full h-9 px-3 text-sm border border-rv-gray bg-white rounded-full focus:outline-none focus:border-black transition-all duration-250"
                    >
                      {DELIVERABLE_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Reference link</label>
                    <input type="url" value={d.reference_url} onChange={e => updateDeliverable(d.key, { reference_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full h-9 px-3 text-sm border border-rv-gray bg-white rounded-full focus:outline-none focus:border-black transition-all duration-250" />
                  </div>
                  <ProductMultiSelect label="Tagged products" products={products} value={d.product_ids}
                    onChange={v => updateDeliverable(d.key, { product_ids: v })} />
                  <div>
                    <label className="block text-xs font-medium mb-1">Assets</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {d.asset_paths.map((p, i) => (
                        <div key={p} className="flex items-center gap-1 h-7 px-2.5 bg-white rounded-full text-xs">
                          <span className="truncate max-w-[120px]">{p.split('/').pop()}</span>
                          <button type="button" onClick={() => updateDeliverable(d.key, { asset_paths: d.asset_paths.filter((_, j) => j !== i) })}
                            className="hover:opacity-70"><X size={10} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => fileRefs.current[d.key]?.click()}
                      className="h-7 px-2.5 rounded-full bg-white text-xs flex items-center gap-1 hover:opacity-70 transition-all duration-250">
                      <Upload size={10} strokeWidth={2} />Upload files
                    </button>
                    <input
                      ref={el => { fileRefs.current[d.key] = el; }}
                      type="file" accept="image/*,video/*" multiple className="hidden"
                      onChange={e => { if (e.target.files) handleAssetUpload(d.key, e.target.files); }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filming team */}
        <MultiSelect label="Filming team" options={TEAM_MEMBERS} value={filmingTeam} onChange={v => setFilmingTeam(v as TeamMember[])} />

        {/* Editing team */}
        <MultiSelect label="Editing team" options={TEAM_MEMBERS} value={editingTeam} onChange={v => setEditingTeam(v as TeamMember[])} />

        {/* Products from library */}
        <ProductMultiSelect label="Products from library" products={products} value={productIds} onChange={setProductIds} />

        {/* Styling notes */}
        <div>
          <label className="block text-xs font-medium mb-1.5">Styling notes</label>
          <textarea
            value={stylingNotes}
            onChange={e => setStylingNotes(e.target.value)}
            rows={3}
            placeholder="Notes about styling, props, etc."
            className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-4 border-t border-rv-gray">
          <button type="button" onClick={onClose}
            className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250 hover:opacity-70">
            Cancel
          </button>
          <button type="submit" disabled={loading || !name.trim()}
            className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium flex items-center gap-2 transition-all duration-250 active:scale-95 disabled:opacity-40">
            {loading && <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />}
            {loading ? 'Saving...' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

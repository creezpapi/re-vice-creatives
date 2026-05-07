'use client';
import { useRef, useState } from 'react';
import { updateCreative } from '@/app/admin/(authed)/creatives/[id]/actions';
import { PLATFORMS } from '@/lib/types';
import type { Creative } from '@/lib/types';

export default function CreativeMetaForm({ creative }: { creative: Creative }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(creative.platforms || []);
  const [isTopPerformer, setIsTopPerformer] = useState<boolean>(creative.is_top_performer || false);

  function togglePlatform(key: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSubmit(formData: FormData) {
    selectedPlatforms.forEach((p) => formData.append('platforms', p));
    formData.set('is_top_performer', isTopPerformer ? 'true' : 'false');
    setSaving(true);
    await updateCreative(creative.id, formData);
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-4">Details</h2>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required defaultValue={creative.title}
            className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={creative.status}
            className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm bg-white">
            <option value="ready_to_launch">Ready to Launch</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsTopPerformer((v) => !v)}
            className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
              (isTopPerformer ? 'bg-amber-400 text-black' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
            Top Performer
          </button>
          {isTopPerformer && (
            <span className="text-xs text-amber-600 font-medium">Tagged as top performer</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const checked = selectedPlatforms.includes(p.key);
              return (
                <button key={p.key} type="button" onClick={() => togglePlatform(p.key)}
                  className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                    (checked ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={creative.notes || ''}
            className="w-full px-4 py-3 border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 text-sm resize-none"
            placeholder="Optional notes..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="ad_copy">Ad Copy</label>
          <textarea id="ad_copy" name="ad_copy" rows={4} defaultValue={creative.ad_copy || ''}
            className="w-full px-4 py-3 border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 text-sm resize-none font-mono"
            placeholder="Headline, body copy, CTA..." />
        </div>
        <div className="pt-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3">Whitelisting</h3>
          <div className="space-y-4 pl-3 border-l-2 border-rv-gray">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="post_link">
                Post Link <span className="text-rv-tab-inactive font-normal">(optional)</span>
              </label>
              <input id="post_link" name="post_link" type="url" defaultValue={creative.post_link || ''}
                className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm"
                placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="ad_code">
                Ad Code <span className="text-rv-tab-inactive font-normal">(optional)</span>
              </label>
              <input id="ad_code" name="ad_code" type="text" defaultValue={creative.ad_code || ''}
                className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm font-mono"
                placeholder="e.g. META-2024-001" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

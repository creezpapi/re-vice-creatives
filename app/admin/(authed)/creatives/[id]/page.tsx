import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AssetUpload from '@/components/admin/AssetUpload';
import CreativeMetaForm from '@/components/admin/CreativeMetaForm';
import TaggedProductsSection from '@/components/admin/TaggedProductsSection';
import { deleteCreativeAndRedirect } from './actions';

type Props = { params: Promise<{ id: string }> };

export default async function CreativeEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: creative } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', id)
    .single();

  if (!creative) notFound();

  const { data: products } = await supabase
    .from('creative_products')
    .select('*')
    .eq('creative_id', id)
    .order('position');

  async function handleDelete() {
    'use server';
    await deleteCreativeAndRedirect(id, creative.asset_path);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">{creative.title}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Asset */}
        <div>
          <AssetUpload creative={creative} />
        </div>

        {/* Right: Meta + Products */}
        <div className="space-y-8">
          <CreativeMetaForm creative={creative} />
          <TaggedProductsSection
            creativeId={id}
            products={products || []}
          />
        </div>
      </div>

      {/* Delete */}
      <div className="mt-12 pt-8 border-t border-rv-gray">
        <form action={handleDelete}>
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm('Delete this creative? This cannot be undone.')) e.preventDefault();
            }}
            className="h-9 px-4 rounded-full text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-all duration-250 active:scale-95"
          >
            Delete creative
          </button>
        </form>
      </div>
    </div>
  );
}

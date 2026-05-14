import { createClient } from '@/lib/supabase/server';
import type { ManualProduct } from '@/lib/types';
import AddProductModal from '@/components/admin/AddProductModal';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import EditProductModal from '@/components/admin/EditProductModal';
import { ExternalLink } from 'lucide-react';

export default async function ProductLibraryPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name, product_link, image_url, image_path, key_details, created_at, updated_at')
    .order('created_at', { ascending: false });

  const items: ManualProduct[] = products || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">Product library</h1>
          <span className="text-sm text-rv-tab-inactive">{items.length} product{items.length !== 1 ? 's' : ''}</span>
        </div>
        <AddProductModal />
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-rv-tab-inactive text-sm">
          No products yet. Click &ldquo;Add product&rdquo; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {items.map((product) => (
            <div key={product.id} className="bg-rv-gray group relative">
              <div className="aspect-[4/5] bg-white">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-rv-gray flex items-center justify-center">
                    <span className="text-xs text-rv-tab-inactive">No image</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{product.name}</p>
                    {product.key_details && (
                      <p className="text-xs text-rv-tab-inactive mt-1 leading-snug whitespace-pre-line line-clamp-3">
                        {product.key_details}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {product.product_link && (
                      <a
                        href={product.product_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-6 w-6 flex items-center justify-center rounded-full text-rv-tab-inactive hover:text-black transition-all duration-250"
                      >
                        <ExternalLink size={14} strokeWidth={1.6} />
                      </a>
                    )}
                    <EditProductModal product={product} />
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

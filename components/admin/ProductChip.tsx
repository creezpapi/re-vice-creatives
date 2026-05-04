import { X } from 'lucide-react';
import { untagProduct } from '@/app/admin/(authed)/creatives/[id]/actions';
import type { CreativeProduct } from '@/lib/types';

export default function ProductChip({ product, creativeId }: { product: CreativeProduct; creativeId: string }) {
  return (
    <div className="bg-rv-gray p-3 flex items-start gap-3 group">
      <div className="w-12 h-12 bg-white flex-shrink-0 overflow-hidden">
        {product.snapshot_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.snapshot_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-rv-gray" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.snapshot_title}</p>
        {product.snapshot_variant_title && (
          <p className="text-xs text-rv-tab-inactive mt-0.5">{product.snapshot_variant_title}</p>
        )}
        {product.snapshot_sku && (
          <p className="text-xs text-rv-tab-inactive">{product.snapshot_sku}</p>
        )}
      </div>
      <form action={() => untagProduct(product.id, creativeId)}>
        <button
          type="submit"
          className="h-6 w-6 rounded-full bg-white flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95 flex-shrink-0"
        >
          <X size={12} strokeWidth={1.6} />
        </button>
      </form>
    </div>
  );
}

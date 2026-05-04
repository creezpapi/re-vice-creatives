'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import ProductChip from './ProductChip';
import ProductPickerModal from './ProductPickerModal';
import type { CreativeProduct } from '@/lib/types';

type Props = {
    creativeId: string;
    products: CreativeProduct[];
};

export default function TaggedProductsSection({ creativeId, products }: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);

  return (
        <div>
              <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-medium">
                        {products.length} product{products.length !== 1 ? 's' : ''} featured
                      </h2>
                      <button
                                  onClick={() => setPickerOpen(true)}
                                  className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70"
                                >
                                <Plus size={14} strokeWidth={1.6} />
                                Add products
                      </button>
              </div>
          {products.length > 0 && (
                  <div className="grid grid-cols-2 gap-0.5">
                    {products.map((p) => (
                                <ProductChip key={p.id} product={p} creativeId={creativeId} />
                              ))}
                  </div>
              )}
          {pickerOpen && (
                  <ProductPickerModal
                              creativeId={creativeId}
                              alreadyTaggedTitles={products.map((p) => p.snapshot_title)}
                              onClose={() => setPickerOpen(false)}
                            />
                )}
        </div>
      );
    </div>
          );
        }

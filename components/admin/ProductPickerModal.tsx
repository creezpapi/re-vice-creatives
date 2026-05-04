'use client';

import { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import Modal from '../common/Modal';
import { tagProducts } from '@/app/admin/(authed)/creatives/[id]/actions';

type ManualProduct = {
    id: string;
    name: string;
    product_link: string | null;
    image_url: string | null;
    image_path: string | null;
    created_at: string;
};

type Selection = {
    shopifyProductId: string | null;
    shopifyVariantId: string | null;
    isManual: boolean;
    snapshotTitle: string;
    snapshotImageUrl: string | null;
    snapshotHandle: string | null;
    snapshotSku: string | null;
    snapshotVariantTitle: string | null;
};

type Props = {
    creativeId: string;
    alreadyTaggedIds: string[];
    onClose: () => void;
};

export default function ProductPickerModal({ creativeId, alreadyTaggedIds, onClose }: Props) {
    const [products, setProducts] = useState<ManualProduct[]>([]);
    const [filtered, setFiltered] = useState<ManualProduct[]>([]);
    const [q, setQ] = useState('');
    const [selections, setSelections] = useState<Record<string, Selection>>({});
    const [loading, setLoading] = useState(false);

  useEffect(() => {
        fetch('/api/admin/products')
          .then((r) => r.json())
          .then((data) => {
                    setProducts(data.products || []);
                    setFiltered(data.products || []);
          })
          .catch(console.error);
  }, []);

  useEffect(() => {
        let result = products;
        if (q) {
                const lower = q.toLowerCase();
                result = result.filter((p) => p.name.toLowerCase().includes(lower));
        }
        setFiltered(result);
  }, [q, products]);

  function selectProduct(product: ManualProduct) {
        const key = product.id;
        if (selections[key]) {
                const next = { ...selections };
                delete next[key];
                setSelections(next);
        } else {
                setSelections({
                          ...selections,
                          [key]: {
                                      shopifyProductId: null,
                                      shopifyVariantId: null,
                                      isManual: false,
                                      snapshotTitle: product.name,
                                      snapshotImageUrl: product.image_url,
                                      snapshotHandle: product.product_link,
                                      snapshotSku: null,
                                      snapshotVariantTitle: null,
                          },
                });
        }
  }

  async function handleAttach() {
        setLoading(true);
        await tagProducts(creativeId, Object.values(selections));
        setLoading(false);
        onClose();
  }

  const selCount = Object.keys(selections).length;

  return (
        <Modal onClose={onClose} wide>
              <h2 className="text-lg font-medium mb-4">Add products</h2>h2>
              <div className="flex flex-wrap gap-3 mb-4">
                      <div className="relative flex-1 min-w-48">
                                <Search size={14} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-tab-inactive" />
                                <input
                                              type="text"
                                              value={q}
                                              onChange={(e) => setQ(e.target.value)}
                                              placeholder="Search products..."
                                              className="w-full h-9 pl-8 pr-4 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
                                            />
                      </div>div>
              </div>div>
              <div className="overflow-y-auto max-h-96 border border-rv-gray rounded-2xl divide-y divide-rv-gray">
                {filtered.length === 0 && (
                    <div className="p-8 text-center text-sm text-rv-tab-inactive">
                                No products in library yet.
                    </div>div>
                      )}
                {filtered.map((product) => {
                    const isAlreadyTagged = alreadyTaggedIds.includes(product.id);
                    const isSelected = !!selections[product.id];
                    return (
                                  <div
                                                  key={product.id}
                                                  className={'p-4 flex items-center gap-3 ' + (isAlreadyTagged ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:opacity-70 transition-all duration-250')}
                                                  onClick={() => !isAlreadyTagged && selectProduct(product)}
                                                >
                                                <div className="w-10 h-10 bg-rv-gray flex-shrink-0 rounded overflow-hidden">
                                                  {product.image_url && (
                                                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                                  )}
                                                </div>div>
                                                <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium">{product.name}</p>p>
                                                  {isAlreadyTagged && <p className="text-xs text-rv-tab-inactive">already tagged</p>p>}
                                                </div>div>
                                    {!isAlreadyTagged && (
                                                                  <div className={'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (isSelected ? 'border-black bg-black' : 'border-rv-gray')}>
                                                                    {isSelected && <Check size={12} strokeWidth={2} className="text-white" />}
                                                                  </div>div>
                                                )}
                                  </div>div>
                                );
        })}
              </div>div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-rv-gray">
                      <span className="text-sm text-rv-tab-inactive">{selCount} selected</span>span>
                      <div className="flex gap-3">
                                <button onClick={onClose} className="h-9 px-4 rounded-full text-sm text-rv-tab-inactive hover:text-black transition-all duration-250">Cancel</button>button>
                                <button
                                              onClick={handleAttach}
                                              disabled={selCount === 0 || loading}
                                              className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-40"
                                            >
                                  {loading ? 'Attaching...' : 'Attach' + (selCount > 0 ? ' ' + selCount : '')}
                                </button>button>
                      </div>div>
              </div>div>
        </Modal>Modal>
      );
}</Modal>

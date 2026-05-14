'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  updateManualProduct,
  getSignedProductImageUploadUrl,
  saveProductImageRecord,
} from '@/app/admin/(authed)/products/actions';
import type { ManualProduct } from '@/lib/types';

type Props = { product: ManualProduct };

export default function EditProductModal({ product }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [productLink, setProductLink] = useState(product.product_link ?? '');
  const [keyDetails, setKeyDetails] = useState(product.key_details ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product.image_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleClose() {
    setName(product.name);
    setProductLink(product.product_link ?? '');
    setKeyDetails(product.key_details ?? '');
    setImageFile(null);
    setPreview(product.image_url);
    setError(null);
    setLoading(false);
    setOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    setLoading(true);
    setError(null);
    try {
      // Update text fields
      await updateManualProduct(product.id, {
        name,
        product_link: productLink || null,
        key_details: keyDetails || null,
      });

      // Upload new image if chosen
      if (imageFile) {
        const { signedUrl, path } = await getSignedProductImageUploadUrl(product.id, imageFile.name);
        const res = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });
        if (!res.ok) throw new Error('Image upload failed');
        await saveProductImageRecord(product.id, path);
      }

      router.refresh();
      handleClose();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-6 w-6 flex items-center justify-center rounded-full text-rv-tab-inactive hover:text-black hover:bg-rv-gray transition-all duration-250"
        title="Edit product"
      >
        <Pencil size={14} strokeWidth={1.6} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium">Edit product</h2>
              <button
                onClick={handleClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"
              >
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product name */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Product name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
                  disabled={loading}
                />
              </div>

              {/* Product link */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Product link</label>
                <input
                  type="url"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
                  disabled={loading}
                />
              </div>

              {/* Key details */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Key product details</label>
                <textarea
                  value={keyDetails}
                  onChange={(e) => setKeyDetails(e.target.value)}
                  rows={4}
                  placeholder="e.g. Sizes XS–XL, available in 3 colorways. Style with high-waisted denim. Key selling point: adjustable tie-back."
                  className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none"
                  disabled={loading}
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Product image</label>
                {preview ? (
                  <div className="relative w-full aspect-[4/3] bg-rv-gray rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-2 right-2 h-7 px-3 flex items-center gap-1 rounded-full bg-white text-xs shadow-sm hover:bg-rv-gray transition-all duration-250"
                    >
                      <Upload size={12} strokeWidth={1.6} />
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-24 border border-dashed border-rv-gray rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-black transition-all duration-250"
                    disabled={loading}
                  >
                    <Upload size={20} strokeWidth={1.6} className="text-rv-tab-inactive" />
                    <span className="text-xs text-rv-tab-inactive">Click to upload image</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-9 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 h-9 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />}
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

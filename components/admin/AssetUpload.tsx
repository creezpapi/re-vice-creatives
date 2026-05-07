'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Images, Plus } from 'lucide-react';
import {
    getSignedUploadUrl,
    saveAssetRecord,
    removeAsset,
    addCarouselImage,
    removeCarouselImage,
} from '@/app/admin/(authed)/creatives/[id]/actions';
import type { Creative } from '@/lib/types';

export default function AssetUpload({ creative }: { creative: Creative }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const carouselFileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [carouselProgress, setCarouselProgress] = useState<string | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [isVideo, setIsVideo] = useState(false);

  async function handleFile(file: File) {
        setUploadProgress('Preparing upload...');
        setLocalPreview(URL.createObjectURL(file));
        setIsVideo(file.type.startsWith('video/'));
        const result = await getSignedUploadUrl(creative.id, file.name);
        if (result.error || !result.signedUrl || !result.path) {
                setUploadProgress('Upload failed: could not get upload URL');
                setLocalPreview(null);
                return;
        }
        setUploadProgress('Uploading...');
        const res = await fetch(result.signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
        });
        if (!res.ok) {
                setUploadProgress('Upload failed. Please try again.');
                setLocalPreview(null);
                return;
        }
        setUploadProgress('Saving...');
        startTransition(async () => {
                await saveAssetRecord(creative.id, result.path!, file.type);
                setUploadProgress(null);
                setLocalPreview(null);
                router.refresh();
        });
  }

  async function handleCarouselFile(file: File) {
        setCarouselProgress('Uploading carousel image...');
        const result = await getSignedUploadUrl(creative.id, 'carousel-' + file.name);
        if (result.error || !result.signedUrl || !result.path) {
                setCarouselProgress('Upload failed: could not get upload URL');
                return;
        }
        const res = await fetch(result.signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
        });
        if (!res.ok) {
                setCarouselProgress('Upload failed. Please try again.');
                return;
        }
        setCarouselProgress('Saving...');
        startTransition(async () => {
                await addCarouselImage(creative.id, file.name, file.type, result.path!);
                setCarouselProgress(null);
                router.refresh();
        });
  }

  const displayUrl = localPreview ?? creative.asset_url;
    const displayIsVideo = localPreview ? isVideo : creative.asset_type === 'video';
    const carouselImages: string[] = creative.carousel_images || [];

  return (
        <div className="space-y-6">
          {/* Main Asset */}
              <div>
                {displayUrl ? (
                    <div className="space-y-3">
                                <div className="bg-rv-gray aspect-video flex items-center justify-center overflow-hidden relative">
                                  {displayIsVideo ? (
                                      <video src={displayUrl} controls className="w-full h-full object-contain" />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={displayUrl} alt={creative.title} className="w-full h-full object-contain" />
                                    )}
                                  {(isPending || uploadProgress) && (
                                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                                                        <Loader2 size={24} strokeWidth={1.6} className="animate-spin text-black" />
                                                        <span className="text-sm text-black">{uploadProgress || 'Saving...'}</span>span>
                                      </div>div>
                                              )}
                                </div>div>
                                <div className="flex gap-2">
                                              <button
                                                                onClick={() => fileRef.current?.click()}
                                                                disabled={isPending || !!uploadProgress}
                                                                className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-40"
                                                              >
                                                              Replace
                                              </button>button>
                                              <button
                                                                type="button"
                                                                disabled={isPending || !!uploadProgress}
                                                                onClick={() => {
                                                                                    startTransition(async () => {
                                                                                                          await removeAsset(creative.id, creative.asset_path!);
                                                                                                          router.refresh();
                                                                                      });
                                                                }}
                                                                className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70 flex items-center gap-1.5 disabled:opacity-40"
                                                              >
                                                              <X size={14} strokeWidth={1.6} />
                                                              Remove
                                              </button>button>
                                </div>div>
                                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                                                onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; handleFile(file); }}
                                              />
                    </div>div>
                  ) : (
                    <label className={`block w-full aspect-video bg-rv-gray flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-70 transition-all duration-250${uploadProgress ? ' opacity-60 pointer-events-none' : ''}` }>
                      {uploadProgress ? (
                                    <>
                                                    <Loader2 size={24} strokeWidth={1.6} className="text-rv-tab-inactive animate-spin" />
                                                    <span className="text-sm text-rv-tab-inactive">{uploadProgress}</span>span>
                                    </>>
                                  ) : (
                                    <>
                                                    <Upload size={24} strokeWidth={1.6} className="text-rv-tab-inactive" />
                                                    <span className="text-sm text-rv-tab-inactive">Click or drag to upload image / video</span>span>
                                                    <span className="text-xs text-rv-tab-inactive">Full resolution preserved</span>span>
                                    </>>
                                  )}
                                <input type="file" accept="image/*,video/*" className="hidden"
                                                onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; handleFile(file); }}
                                              />
                    </label>label>
                      )}
              </div>div>
        
          {/* Carousel Images */}
              <div>
                      <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                            <Images size={16} strokeWidth={1.6} className="text-rv-tab-inactive" />
                                            <h3 className="text-sm font-medium">Carousel Images</h3>h3>
                                  {carouselImages.length > 0 && (
                        <span className="text-xs text-rv-tab-inactive">({carouselImages.length})</span>span>
                                            )}
                                </div>div>
                                <button
                                              type="button"
                                              onClick={() => carouselFileRef.current?.click()}
                                              disabled={isPending || !!carouselProgress}
                                              className="h-7 px-3 rounded-full bg-rv-gray text-xs font-medium flex items-center gap-1.5 hover:opacity-70 transition-all duration-250 disabled:opacity-40"
                                            >
                                            <Plus size={12} strokeWidth={1.6} />
                                            Add image
                                </button>button>
                      </div>div>
                {carouselProgress && (
                    <div className="flex items-center gap-2 text-xs text-rv-tab-inactive mb-2">
                                <Loader2 size={12} strokeWidth={1.6} className="animate-spin" />
                      {carouselProgress}
                    </div>div>
                      )}
                {carouselImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {carouselImages.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square bg-rv-gray overflow-hidden">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt={`Carousel ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                                        type="button"
                                                                        onClick={() => { startTransition(async () => { await removeCarouselImage(creative.id, url); router.refresh(); }); }}
                                                                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                      >
                                                                      <X size={10} strokeWidth={2} />
                                                    </button>button>
                                                    <span className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 rounded">{idx + 1}</span>span>
                                    </div>div>
                                  ))}
                    </div>div>
                  ) : (
                    <div className="text-xs text-rv-tab-inactive py-4 text-center border border-dashed border-rv-gray rounded-lg">
                                No carousel images yet. Click "Add image" to upload.
                    </div>div>
                      )}
                      <input ref={carouselFileRef} type="file" accept="image/*" multiple className="hidden"
                                  onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                for (const file of files) { await handleCarouselFile(file); }
                                                e.target.value = '';
                                  }}
                                />
              </div>div>
        </div>div>
      );
}</></></div>

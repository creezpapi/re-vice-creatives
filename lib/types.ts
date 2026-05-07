export type Creative = {
    id: string;
    title: string;
    notes: string | null;
    status: 'ready_to_launch' | 'active' | 'archived';
    asset_type: 'image' | 'video' | null;
    asset_url: string | null;
    asset_path: string | null;
    thumb_url: string | null;
    carousel_images: string[] | null;
    platforms: string[];
    ad_copy: string | null;
    post_link: string | null;
    ad_code: string | null;
    is_top_performer: boolean;
    created_at: string;
    updated_at: string;
};

export type CreativeProduct = {
    id: string;
    creative_id: string;
    shopify_product_id: string | null;
    shopify_variant_id: string | null;
    is_manual: boolean;
    snapshot_title: string;
    snapshot_image_url: string | null;
    snapshot_handle: string | null;
    snapshot_sku: string | null;
    snapshot_variant_title: string | null;
    position: number;
    created_at: string;
};

export type ShopifyProduct = {
    id: string;
    shopify_id: string;
    handle: string;
    title: string;
    product_type: string | null;
    vendor: string | null;
    available: boolean;
    image_url: string | null;
    online_store_url: string | null;
    raw: Record<string, unknown> | null;
    last_synced_at: string;
    created_at: string;
    updated_at: string;
};

export type ShopifyVariant = {
    id: string;
    product_id: string;
    shopify_variant_id: string;
    title: string;
    sku: string | null;
    price: string | null;
    currency_code: string | null;
    available: boolean;
    position: number;
};

export type ManualProduct = {
    id: string;
    name: string;
    product_link: string | null;
    image_url: string | null;
    image_path: string | null;
    created_at: string;
    updated_at: string;
};

export const PLATFORMS = [
  { key: 'google_pmax', label: 'Google Performance Max' },
  { key: 'tiktok_main', label: 'TikTok Main' },
  { key: 'tiktok_gmv', label: 'TikTok GMV Max' },
  { key: 'meta', label: 'Meta' },
  { key: 'meta_carousel', label: 'Meta Carousel' },
  { key: 'meta_enhance', label: 'Meta Enhance' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'youtube_demandgen', label: 'YouTube Demand Gen' },
  ] as const;

export type PlatformKey = typeof PLATFORMS[number]['key'];

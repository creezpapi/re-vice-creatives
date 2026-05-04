export type NormalizedShopifyVariant = {
  shopifyVariantId: string;
  title: string;
  sku: string | null;
  price: string | null;
  currencyCode: string | null;
  available: boolean;
  position: number;
};

export type NormalizedShopifyProduct = {
  shopifyId: string;
  handle: string;
  title: string;
  productType: string | null;
  vendor: string | null;
  available: boolean;
  imageUrl: string | null;
  onlineStoreUrl: string | null;
  raw: Record<string, unknown>;
  variants: NormalizedShopifyVariant[];
};

import type { NormalizedShopifyProduct, NormalizedShopifyVariant } from './types';
import { MOCK_PRODUCTS } from './mock-products';

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2024-10';

export function isShopifyConfigured(): boolean {
  return !!(DOMAIN && TOKEN);
}

const PRODUCTS_QUERY = `
  query GetAllProducts($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          productType
          vendor
          availableForSale
          onlineStoreUrl
          featuredImage { url }
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                availableForSale
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchAllProducts(): Promise<NormalizedShopifyProduct[]> {
  if (!isShopifyConfigured()) return MOCK_PRODUCTS;

  const all: NormalizedShopifyProduct[] = [];
  let cursor: string | null = null;

  while (true) {
    const res = await fetch(
      `https://${DOMAIN}/api/${VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': TOKEN!,
        },
        body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { cursor } }),
      }
    );

    if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
    const json = await res.json();
    const products = json?.data?.products;
    if (!products) break;

    for (const edge of products.edges) {
      const node = edge.node;
      const variants: NormalizedShopifyVariant[] = node.variants.edges.map(
        (v: { node: { id: string; title: string; sku: string; availableForSale: boolean; price: { amount: string; currencyCode: string } } }, i: number) => ({
          shopifyVariantId: v.node.id,
          title: v.node.title,
          sku: v.node.sku || null,
          price: v.node.price?.amount || null,
          currencyCode: v.node.price?.currencyCode || null,
          available: v.node.availableForSale,
          position: i,
        })
      );

      all.push({
        shopifyId: node.id,
        handle: node.handle,
        title: node.title,
        productType: node.productType || null,
        vendor: node.vendor || null,
        available: node.availableForSale,
        imageUrl: node.featuredImage?.url || null,
        onlineStoreUrl: node.onlineStoreUrl || null,
        raw: node,
        variants,
      });
    }

    if (!products.pageInfo.hasNextPage) break;
    cursor = products.pageInfo.endCursor;
  }

  return all;
}

'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type Product = { shopify_id: string; title: string };

export default function ProductFilter({
  products,
  activeProduct,
}: {
  products: Product[];
  activeProduct?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('product', e.target.value);
    } else {
      params.delete('product');
    }
    router.push(pathname + '?' + params.toString());
  }

  return (
    <select
      value={activeProduct || ''}
      onChange={handleChange}
      className="w-full h-8 px-3 text-xs border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250"
    >
      <option value="">All products</option>
      {products.map((p) => (
        <option key={p.shopify_id} value={p.shopify_id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}

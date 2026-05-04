import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: products } = await supabase
    .from('shopify_products')
    .select('id, shopify_id, handle, title, product_type, available, image_url, online_store_url, shopify_variants(*)')
    .order('title');

  return NextResponse.json({ products: products || [] });
}

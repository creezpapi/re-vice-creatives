-- re-vice-creatives database schema
-- Idempotent — safe to re-run

create extension if not exists "uuid-ossp";

-- Admin allowlist
create table if not exists public.admins (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Seed first admin
insert into public.admins (email) values ('beau@re-vice.com') on conflict (email) do nothing;

-- Creatives
create table if not exists public.creatives (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  notes text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  asset_type text check (asset_type in ('image','video')),
  asset_url text,
  asset_path text,
  thumb_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creatives_status_idx on public.creatives(status);
create index if not exists creatives_created_idx on public.creatives(created_at desc);

-- Shopify products
create table if not exists public.shopify_products (
  id uuid primary key default uuid_generate_v4(),
  shopify_id text unique not null,
  handle text not null,
  title text not null,
  product_type text,
  vendor text,
  available boolean not null default true,
  image_url text,
  online_store_url text,
  raw jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shopify_products_handle_idx on public.shopify_products(handle);
create index if not exists shopify_products_title_idx on public.shopify_products using gin (to_tsvector('simple', title));
create index if not exists shopify_products_type_idx on public.shopify_products(product_type);
create index if not exists shopify_products_available_idx on public.shopify_products(available);

create table if not exists public.shopify_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.shopify_products(id) on delete cascade,
  shopify_variant_id text unique not null,
  title text not null,
  sku text,
  price text,
  currency_code text,
  available boolean not null default true,
  position int not null default 0
);
create index if not exists shopify_variants_product_idx on public.shopify_variants(product_id);
create index if not exists shopify_variants_sku_idx on public.shopify_variants(sku);

-- Creative to product attachments
create table if not exists public.creative_products (
  id uuid primary key default uuid_generate_v4(),
  creative_id uuid not null references public.creatives(id) on delete cascade,
  shopify_product_id uuid references public.shopify_products(id) on delete set null,
  shopify_variant_id uuid references public.shopify_variants(id) on delete set null,
  is_manual boolean not null default false,
  snapshot_title text not null,
  snapshot_image_url text,
  snapshot_handle text,
  snapshot_sku text,
  snapshot_variant_title text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists creative_products_creative_idx on public.creative_products(creative_id);
create index if not exists creative_products_shopify_idx on public.creative_products(shopify_product_id);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_creatives_updated on public.creatives;
create trigger trg_creatives_updated before update on public.creatives
  for each row execute function public.set_updated_at();

drop trigger if exists trg_shopify_products_updated on public.shopify_products;
create trigger trg_shopify_products_updated before update on public.shopify_products
  for each row execute function public.set_updated_at();

-- RLS
alter table public.admins enable row level security;
alter table public.creatives enable row level security;
alter table public.shopify_products enable row level security;
alter table public.shopify_variants enable row level security;
alter table public.creative_products enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins" on public.admins for select using (public.is_admin());

drop policy if exists "Admins can manage creatives" on public.creatives;
create policy "Admins can manage creatives" on public.creatives for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage shopify_products" on public.shopify_products;
create policy "Admins can manage shopify_products" on public.shopify_products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage shopify_variants" on public.shopify_variants;
create policy "Admins can manage shopify_variants" on public.shopify_variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage creative_products" on public.creative_products;
create policy "Admins can manage creative_products" on public.creative_products for all using (public.is_admin()) with check (public.is_admin());

-- Storage policies (creatives bucket must be created in the Storage UI)
drop policy if exists "Public read creatives" on storage.objects;
create policy "Public read creatives" on storage.objects for select using (bucket_id = 'creatives');

drop policy if exists "Admins can upload creatives" on storage.objects;
create policy "Admins can upload creatives" on storage.objects for insert with check (bucket_id = 'creatives' and public.is_admin());

drop policy if exists "Admins can update creatives" on storage.objects;
create policy "Admins can update creatives" on storage.objects for update using (bucket_id = 'creatives' and public.is_admin());

drop policy if exists "Admins can delete creatives" on storage.objects;
create policy "Admins can delete creatives" on storage.objects for delete using (bucket_id = 'creatives' and public.is_admin());

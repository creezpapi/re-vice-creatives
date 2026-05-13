-- Migration 003: Content Creation tables
-- Idempotent -- safe to re-run
-- Storage bucket: content-assets (public read, admin write)
-- Run in Supabase SQL Editor before redeploying

create table if not exists public.content_tasks (
  id              uuid        primary key default uuid_generate_v4(),
  name            text        not null,
  filming_date    date,
  post_date       date,
  team_member_tags text[]     not null default '{}',
  filming_team    text[]      not null default '{}',
  editing_team    text[]      not null default '{}',
  product_ids     uuid[]      not null default '{}',
  styling_notes   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.content_deliverables (
  id               uuid        primary key default uuid_generate_v4(),
  task_id          uuid        not null references public.content_tasks(id) on delete cascade,
  deliverable_type text        not null,
  reference_url    text,
  product_ids      uuid[]      not null default '{}',
  asset_paths      text[]      not null default '{}',
  position         int         not null default 0,
  created_at       timestamptz not null default now()
);

do $$ begin
  alter table public.content_deliverables
    add constraint content_deliverables_type_check
    check (deliverable_type in (
      'Tiktok Trend','Instagram Photos','Brand Ad','Product Detail Video',
      'Brand Series Video','Styling Video','Talking Detail Video',
      'Influencer Video','Livestream','Instagram Story',
      'Instagram Broadcast Channel','Tiktok Broadcast Channel'
    ));
exception
  when duplicate_object then null;
end $$;

create index if not exists content_tasks_filming_date_idx on public.content_tasks(filming_date);
create index if not exists content_tasks_created_idx      on public.content_tasks(created_at desc);
create index if not exists content_deliverables_task_idx  on public.content_deliverables(task_id);

drop trigger if exists trg_content_tasks_updated on public.content_tasks;
create trigger trg_content_tasks_updated
  before update on public.content_tasks
  for each row execute function public.set_updated_at();

alter table public.content_tasks        enable row level security;
alter table public.content_deliverables enable row level security;

drop policy if exists "Admins can manage content_tasks"        on public.content_tasks;
create policy "Admins can manage content_tasks"
  on public.content_tasks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage content_deliverables" on public.content_deliverables;
create policy "Admins can manage content_deliverables"
  on public.content_deliverables for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read content-assets"       on storage.objects;
create policy "Public read content-assets"
  on storage.objects for select using (bucket_id = 'content-assets');

drop policy if exists "Admins can upload content-assets" on storage.objects;
create policy "Admins can upload content-assets"
  on storage.objects for insert
  with check (bucket_id = 'content-assets' and public.is_admin());

drop policy if exists "Admins can update content-assets" on storage.objects;
create policy "Admins can update content-assets"
  on storage.objects for update
  using (bucket_id = 'content-assets' and public.is_admin());

drop policy if exists "Admins can delete content-assets" on storage.objects;
create policy "Admins can delete content-assets"
  on storage.objects for delete
  using (bucket_id = 'content-assets' and public.is_admin());

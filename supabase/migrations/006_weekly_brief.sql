-- Migration 006: Weekly Brief tables
-- Idempotent -- safe to re-run

-- One row per week (keyed by the Monday of that week)
create table if not exists public.weekly_briefs (
  id          uuid primary key default uuid_generate_v4(),
  week_start  date not null unique,  -- always the Monday
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per day-of-week entry (0=Mon … 6=Sun)
create table if not exists public.weekly_brief_days (
  id              uuid primary key default uuid_generate_v4(),
  brief_id        uuid not null references public.weekly_briefs(id) on delete cascade,
  day_index       int  not null check (day_index between 0 and 6),
  -- Five per-day fields
  deliverable_types  text[]   not null default '{}',
  team_members       text[]   not null default '{}',
  product_ids        uuid[]   not null default '{}',
  reference_url      text,
  notes              text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (brief_id, day_index)
);

create index if not exists weekly_briefs_week_start_idx    on public.weekly_briefs(week_start);
create index if not exists weekly_brief_days_brief_idx     on public.weekly_brief_days(brief_id);

drop trigger if exists trg_weekly_briefs_updated on public.weekly_briefs;
create trigger trg_weekly_briefs_updated
  before update on public.weekly_briefs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_brief_days_updated on public.weekly_brief_days;
create trigger trg_weekly_brief_days_updated
  before update on public.weekly_brief_days
  for each row execute function public.set_updated_at();

alter table public.weekly_briefs      enable row level security;
alter table public.weekly_brief_days  enable row level security;

drop policy if exists "Admins manage weekly_briefs"     on public.weekly_briefs;
create policy "Admins manage weekly_briefs"
  on public.weekly_briefs for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage weekly_brief_days" on public.weekly_brief_days;
create policy "Admins manage weekly_brief_days"
  on public.weekly_brief_days for all
  using (public.is_admin()) with check (public.is_admin());

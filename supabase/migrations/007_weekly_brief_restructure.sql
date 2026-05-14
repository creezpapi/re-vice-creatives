-- Migration 007: Restructure weekly_brief_days
-- 1. Add product_category column (text array)
-- 2. Add deliverable_items column (jsonb) — replaces flat team_members + reference_url
--    Each item: { type: string, team_members: string[], reference_url: string | null }
-- 3. Keep team_members and reference_url columns for now (no data loss); they become unused

alter table public.weekly_brief_days
  add column if not exists product_category text[] not null default '{}',
  add column if not exists deliverable_items jsonb not null default '[]'::jsonb;

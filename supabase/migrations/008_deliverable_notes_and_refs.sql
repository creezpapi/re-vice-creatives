-- Migration 008: Add reference_urls array and notes to content_deliverables
-- Idempotent -- safe to re-run
-- Run in Supabase SQL Editor before redeploying

-- Add multiple reference links array (replaces single reference_url, kept for compat)
alter table public.content_deliverables
  add column if not exists reference_urls text[] not null default '{}';

-- Add per-deliverable notes field
alter table public.content_deliverables
  add column if not exists notes text;

-- Backfill reference_urls from existing reference_url values (one-time migration)
update public.content_deliverables
  set reference_urls = array[reference_url]
  where reference_url is not null
    and reference_urls = '{}';

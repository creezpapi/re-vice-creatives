-- Migration 005: Add filming_team and editing_team to content_deliverables
-- Idempotent -- safe to re-run

alter table public.content_deliverables
  add column if not exists filming_team text[] not null default '{}';

alter table public.content_deliverables
  add column if not exists editing_team text[] not null default '{}';

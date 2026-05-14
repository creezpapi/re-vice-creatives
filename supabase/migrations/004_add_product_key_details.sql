-- Migration 004: Add key_details to manual_products
-- Idempotent — safe to re-run

alter table public.manual_products
  add column if not exists key_details text;

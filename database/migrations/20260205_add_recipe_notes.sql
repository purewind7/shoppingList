-- Adds notes column to recipes for instructions/quantities.
-- Safe to run multiple times.

alter table public.recipes
  add column if not exists notes text;

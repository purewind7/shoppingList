-- Adds per-user store management table + RLS policies.
-- Safe to run multiple times.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx
  on public.stores(user_id);

alter table public.stores enable row level security;

drop policy if exists "Users can read their stores" on public.stores;
drop policy if exists "Users can insert their stores" on public.stores;
drop policy if exists "Users can delete their stores" on public.stores;

create policy "Users can read their stores"
on public.stores for select
using (auth.uid() = user_id);

create policy "Users can insert their stores"
on public.stores for insert
with check (auth.uid() = user_id);

create policy "Users can delete their stores"
on public.stores for delete
using (auth.uid() = user_id);

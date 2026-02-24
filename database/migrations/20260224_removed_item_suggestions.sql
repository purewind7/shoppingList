-- Persist removed/completed items as add-item suggestions.
-- Safe to run multiple times.

create table if not exists public.removed_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  supermarket text not null default 'General',
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists removed_item_suggestions_user_id_idx
  on public.removed_item_suggestions(user_id);

alter table public.removed_item_suggestions enable row level security;

drop policy if exists "Users can read their removed item suggestions" on public.removed_item_suggestions;
drop policy if exists "Users can insert their removed item suggestions" on public.removed_item_suggestions;
drop policy if exists "Users can update their removed item suggestions" on public.removed_item_suggestions;

create policy "Users can read their removed item suggestions"
on public.removed_item_suggestions for select
using (auth.uid() = user_id);

create policy "Users can insert their removed item suggestions"
on public.removed_item_suggestions for insert
with check (auth.uid() = user_id);

create policy "Users can update their removed item suggestions"
on public.removed_item_suggestions for update
using (auth.uid() = user_id);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  supermarket text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists grocery_items_user_id_idx
  on public.grocery_items(user_id);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx
  on public.recipes(user_id);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  supermarket text
);

create index if not exists recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients(recipe_id);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx
  on public.stores(user_id);

alter table public.grocery_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.stores enable row level security;

create policy "Users can read their grocery items"
on public.grocery_items for select
using (auth.uid() = user_id);

create policy "Users can insert their grocery items"
on public.grocery_items for insert
with check (auth.uid() = user_id);

create policy "Users can update their grocery items"
on public.grocery_items for update
using (auth.uid() = user_id);

create policy "Users can delete their grocery items"
on public.grocery_items for delete
using (auth.uid() = user_id);

create policy "Users can read their recipes"
on public.recipes for select
using (auth.uid() = user_id);

create policy "Users can insert their recipes"
on public.recipes for insert
with check (auth.uid() = user_id);

create policy "Users can update their recipes"
on public.recipes for update
using (auth.uid() = user_id);

create policy "Users can delete their recipes"
on public.recipes for delete
using (auth.uid() = user_id);

create policy "Users can read ingredients for their recipes"
on public.recipe_ingredients for select
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
  )
);

create policy "Users can insert ingredients for their recipes"
on public.recipe_ingredients for insert
with check (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
  )
);

create policy "Users can delete ingredients for their recipes"
on public.recipe_ingredients for delete
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
  )
);

create policy "Users can read their stores"
on public.stores for select
using (auth.uid() = user_id);

create policy "Users can insert their stores"
on public.stores for insert
with check (auth.uid() = user_id);

create policy "Users can delete their stores"
on public.stores for delete
using (auth.uid() = user_id);

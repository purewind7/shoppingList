# Shopping Notes - Copilot Instructions

## Project Overview
Shopping Notes is a Next.js App Router project with a client-rendered main app and Supabase backend.

- Framework: Next.js 15 (`app/` router)
- UI runtime: React client component in `src/app/App.tsx`
- Backend: Supabase Auth + Postgres + RLS
- Styling: Tailwind CSS v4
- Animation: `motion/react`

Do not implement new persistence using `localStorage`. Persistence is database-backed.

## Current Architecture

### Entry Points
- `app/layout.tsx`: global metadata, icon/manifest configuration, global CSS import
- `app/page.tsx`: mounts `src/app/App.tsx`
- `src/app/App.tsx`: state orchestration, auth lifecycle, CRUD, tab switching, swipe interactions
- `src/lib/supabaseClient.ts`: browser Supabase client initialization from env vars

### Domain Data (Postgres)
- `grocery_items`: user-owned shopping items
- `recipes`: user-owned recipes with `notes`
- `recipe_ingredients`: child rows of recipes
- `stores`: user-owned store catalog entries

Schema and policies:
- `database/schema.sql`
- `database/migrations/20260205_add_stores.sql`
- `database/migrations/20260205_add_recipe_notes.sql`

### Security Model
RLS policies enforce user ownership:
- `grocery_items.user_id = auth.uid()`
- `recipes.user_id = auth.uid()`
- `stores.user_id = auth.uid()`
- `recipe_ingredients` authorized through parent `recipes`

## Data Flow Conventions

### Auth
- Session source: Supabase Auth (`getSession`, `onAuthStateChange`)
- Sign in/up: email + password
- Sign out: global then local sign-out; clear local React state immediately

### CRUD Pattern
In `src/app/App.tsx`:
1. Execute Supabase mutation/query
2. Handle `error` explicitly
3. Normalize DB row to UI shape
4. Update local state immutably

Use functional state updates (`setX(prev => ...)`) for updates based on prior state.

### Store Tag Behavior
- Store tags are persisted through normalized join tables:
  - `grocery_item_stores (item_id, store_id)`
  - `recipe_ingredient_stores (ingredient_id, store_id)`
- UI splits/normalizes tags when grouping/selecting.
- Missing store tags discovered from items are backfilled into `stores`.

## UI Structure

Primary feature components in `src/app/components/`:
- `AddItem.tsx`
- `ItemForm.tsx`
- `GroceryItem.tsx`
- `EditItemModal.tsx`
- `RecipeList.tsx`
- `AddRecipeModal.tsx` (used for create and edit)
- `RecipeImportModal.tsx`
- `StoreManagerModal.tsx`

Reusable primitives:
- `src/app/components/ui/*` (Radix-style/shadcn-style primitives)

Other:
- `src/app/components/figma/ImageWithFallback.tsx`
- `src/app/colors.ts` (centralized palette constants)

## Tab and Interaction Rules
- Tabs: `'all' | 'by-store' | 'recipes'`
- Mobile swipe switches tabs (with threshold checks to avoid vertical-scroll conflicts)
- Tab transitions are directional carousel-like animations
- Search field includes one-tap clear button

When changing tab behavior, keep:
- button tab switching
- swipe switching
- direction-aware transition animation
in sync.

## Styling and Motion
- Tailwind classes are primary styling mechanism.
- Use existing visual language; avoid introducing unrelated design systems.
- Motion imports use:
```tsx
import { motion, AnimatePresence } from 'motion/react';
```

## Environment and Config
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Defined in `.env.local`; template in `.env.example`

## Build and Run
Use npm scripts from `package.json`:
```bash
npm install
npm run dev
npm run build
npm run start
```

## Import/Path Conventions
- Path alias `@/*` maps to `src/*` (from `tsconfig.json`)
- Prefer `@/...` imports for app code

## Change Guidance for Agents

### When adding new persisted fields
1. Add DB migration under `database/migrations/`
2. Update `database/schema.sql` baseline
3. Update TS interfaces in `src/app/App.tsx` and affected components
4. Update Supabase `select`/`insert`/`update` queries
5. Ensure UI edit/create flows both handle the new field

### When changing forms/modals
- `ItemForm` is reused by item and ingredient workflows.
- Avoid effects that reset controlled inputs on every re-render.
- Keep mobile behavior stable (no focus-loss reset regressions).

### When changing auth/data loading
- Keep session listener subscription cleanup intact.
- Preserve explicit error handling for all Supabase calls.
- Avoid introducing load loops from effect dependencies.

## Do Not Reintroduce
- Vite-specific config or assumptions
- `localStorage` as the primary source of truth
- Unscoped data queries that bypass RLS ownership constraints

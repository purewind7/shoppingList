# Shopping Notes Architecture

## 1. Overview

Shopping Notes is a Next.js App Router application that runs a client-first UI backed by Supabase:

- Framework: Next.js 15 (`app/` router)
- UI runtime: React client component (`src/app/App.tsx`)
- Data/auth backend: Supabase Auth + Postgres
- Styling: Tailwind CSS v4
- Motion: `motion/react` for tab/content transitions

The app is effectively a single-page experience mounted by Next.js. Server-side rendering is used for app shell delivery, while interactive behavior runs in the browser and CRUD is executed through authenticated Next.js route handlers.

## 2. Repository Organization

Top-level:

- `app/layout.tsx`
- `app/page.tsx`
- `src/app/App.tsx`
- `src/app/components/*`
- `src/lib/supabaseClient.ts`
- `src/styles/*`
- `database/schema.sql`
- `database/migrations/*.sql`
- `public/*` (icons, manifest)

Routing:

- `app/layout.tsx` defines global metadata, favicon/apple icon, and manifest links.
- `app/page.tsx` mounts the main app component from `src/app/App.tsx`.

Application core:

- `src/app/App.tsx` owns app state, auth/session state, data loading, tab navigation, and all Supabase CRUD orchestration.

UI components:

- `src/app/components/AddItem.tsx` + `ItemForm.tsx`: item input and store tag selection.
- `src/app/components/GroceryItem.tsx`: item row with toggle/edit/delete.
- `src/app/components/EditItemModal.tsx`: item editing modal.
- `src/app/components/AddRecipeModal.tsx`: create/edit recipe, ingredient list, recipe notes.
- `src/app/components/RecipeList.tsx`: recipe list with expand/edit/delete.
- `src/app/components/RecipeImportModal.tsx`: import ingredients from a selected recipe.
- `src/app/components/StoreManagerModal.tsx`: add/remove store catalog entries.
- `src/app/components/ui/*`: shared UI primitives (Radix-based pattern).

Data clients:

- `src/lib/supabaseClient.ts`: initializes browser Supabase client for auth/session.
- `src/lib/apiClient.ts`: calls internal `/api/*` endpoints with bearer token.

Database:

- `database/schema.sql`: full schema and RLS policies.
- `database/migrations/20260205_add_stores.sql`: incremental stores table setup.
- `database/migrations/20260205_add_recipe_notes.sql`: adds `recipes.notes`.

## 3. Runtime Layers

### Presentation layer

- React components render tabs, forms, modals, and lists.
- Local component state controls UI behavior (open modals, current tab, search query, swipe state, animation direction).

### Application/state layer

- `App.tsx` stores canonical in-memory data:
  - `items`
  - `recipes`
  - `knownStores`
  - auth/session state
- It maps UI actions to Supabase operations and merges results back into local state.

### Data access layer

- Next.js route handlers in `app/api/*` perform CRUD and validation.
- Route handlers use Supabase JS server-side with caller bearer token for RLS-safe access.

### Security layer

- RLS policies on all domain tables restrict access to the authenticated user.
- `user_id` ownership pattern is used for `grocery_items`, `recipes`, and `stores`.
- `recipe_ingredients` is authorized by joining through `recipes.user_id`.

## 4. Domain Model

Primary entities:

- `grocery_items`
  - `id`, `user_id`, `name`, `supermarket`, `completed`, `created_at`
- `recipes`
  - `id`, `user_id`, `name`, `notes`, `created_at`
- `recipe_ingredients`
  - `id`, `recipe_id`, `name`, `supermarket`
- `stores`
  - `id`, `user_id`, `name`, `created_at`
- `grocery_item_stores`
  - `item_id`, `store_id` (many-to-many links for item tags)
- `recipe_ingredient_stores`
  - `ingredient_id`, `store_id` (many-to-many links for ingredient tags)

Important modeling notes:

- Store tagging is normalized through join tables, not comma-delimited persistence.
- `stores` acts as a managed user-specific catalog for checkbox selections and link targets.
- Recipe notes support free-form instructions/quantities/context.

## 5. Data Flow

### 5.1 App bootstrap

1. Next.js serves `app/layout.tsx` and `app/page.tsx`.
2. `App.tsx` loads in the browser (`'use client'`).
3. App gets auth session via `supabase.auth.getSession()`.
4. App subscribes to auth state changes.
5. If session exists, `loadData()` fetches:
   - `grocery_items`
   - `recipes` with nested `recipe_ingredients`
   - `stores`
6. Data is normalized into local React state arrays.

### 5.2 Authentication flow

- Sign in/up uses Supabase email/password methods.
- Sign out attempts global sign-out first, then local sign-out.
- UI session state is cleared explicitly (`setSession(null)`) to avoid stale UI when tokens are invalid.

### 5.3 Grocery item flow

Create:

1. User submits `ItemForm`.
2. App inserts into `grocery_items`.
3. Returned row is prepended to `items`.

Update:

1. User opens edit modal.
2. App updates `name` and `supermarket`.
3. Matching item in state is replaced with returned row.

Toggle complete:

1. User toggles checkbox.
2. App updates `completed` on the row.
3. Local state is patched for that item.

Delete / clear completed:

1. User triggers delete action.
2. App deletes rows from `grocery_items`.
3. Local state filters out removed rows.

### 5.4 Recipe flow

Create recipe:

1. User opens `AddRecipeModal`.
2. User adds ingredients + notes.
3. App inserts into `recipes`, then inserts `recipe_ingredients`.
4. New recipe object is prepended to state.

Edit recipe:

1. User opens edit from `RecipeList`.
2. Same modal is reused with initial values.
3. App updates recipe row, deletes old ingredients, reinserts new list.
4. Local recipe entry is replaced.

Delete recipe:

1. User clicks delete in list row.
2. App deletes recipe row.
3. Cascading FK removes ingredients in DB.
4. State removes recipe.

Import recipe ingredients:

1. User picks recipe in `RecipeImportModal`.
2. App bulk inserts ingredients as new `grocery_items`.
3. State prepends inserted items.

### 5.5 Store catalog flow

Store loading:

- `stores` table values are fetched on `loadData()`.

Store catalog maintenance:

- `StoreManagerModal` adds/removes rows in `stores`.
- Defaults are merged in UI for baseline options.

Store auto-backfill:

- During load, item store tags are parsed.
- Missing tags not in DB are inserted into `stores`.

## 6. UI and Interaction Architecture

Tab system:

- Tabs are represented by `TabType = 'all' | 'by-store' | 'recipes'`.
- `switchTab()` computes direction for animated transitions.
- Mobile swipe (`touchstart`/`touchend`) changes tabs with threshold logic.

Animation:

- `AnimatePresence` + `motion.div` implements directional carousel-like transitions between tabs.

Search:

- Client-side filter against item name and supermarket text.
- Clear button resets search in one tap.

Mobile behavior:

- iOS input zoom prevention on search by using `text-base` on mobile.
- Scroll-to-top button appears only on mobile after vertical scroll.

## 7. Styling and Assets

- Global styles are loaded in `app/layout.tsx` via `src/styles/index.css`.
- Tailwind v4 configured through `postcss.config.cjs`.
- PWA metadata includes manifest and iOS app-capable metadata.
- Icons:
  - `public/favicon.ico`
  - `public/apple-touch-icon.png`
  - `public/site.webmanifest`

## 8. Reliability and Constraints

Current strengths:

- Data isolation via RLS.
- Store tag persistence is normalized with explicit many-to-many links.
- Client state updates are mostly optimistic-with-server-return, reducing accidental divergence.
- Incremental SQL migrations exist for post-schema changes.

Known constraints:

- Route handlers currently perform request-level validation, but domain-specific validation remains basic and can be expanded.
- Recipe ingredient edit strategy is replace-all on save (delete + insert), not diff-based patching.

## 9. Suggested Next Architecture Steps

1. Generate typed Supabase DB client types and enforce compile-time query contracts.
2. Add integration tests for key flows (auth, item CRUD, recipe edit, store sync).
3. Add error boundary/toast strategy for user-visible failure handling.
4. Consider server actions for mutation-heavy flows that require progressive enhancement.

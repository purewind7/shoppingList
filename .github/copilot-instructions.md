# Shopping Notes - Copilot Instructions

## Project Overview
Shopping Notes is a React-based grocery list manager with recipe support, built with Vite, TypeScript, and Tailwind CSS. It features a tab-based UI for viewing items by store, managing recipes, and importing ingredients into shopping lists. All data persists locally via `localStorage`.

## Architecture & Data Flow

### Core State Management (App.tsx)
The app maintains three primary state collections in `localStorage`:
- **items**: Grocery items with `{id, name, supermarket, completed, createdAt}`
- **recipes**: Saved recipes with `{id, name, ingredients[], createdAt}`
- **knownStores**: Auto-populated store names from added items/recipes (starts with defaults: Costco, Trader Joe's, 99 Ranch, H mart)

**Data Flow Pattern:**
1. Items added via `AddItem` → stored in state and `localStorage` automatically
2. Recipes added/imported → automatically extract store names via `updateKnownStores()`
3. Recipe import → converts ingredients to items, preserving supermarket mapping
4. All state updates use immutable patterns with spread operators and `.map()`/`.filter()`

### UI Tab Structure
Three main tabs in `App.tsx` (`activeTab: 'all' | 'by-store' | 'recipes'`):
- **all**: Lists all items with search filtering
- **by-store**: Groups items by supermarket (includes header with completion stats)
- **recipes**: Display and manage saved recipes

### Component Hierarchy
```
App (state management + tab routing)
├── AddItem (input toggle + ItemForm)
├── GroceryItem (individual item card with animation)
├── RecipeList (recipe cards with delete)
├── AddRecipeModal (form for creating recipes)
├── RecipeImportModal (selector for importing recipe ingredients)
└── ImageWithFallback (Figma-sourced images with error handling)
```

## Key Conventions & Patterns

### UUID Generation
Use `crypto.randomUUID()` for all unique IDs (never use Math.random or manual strings).

### Styling Approach
- **Tailwind CSS** via `@tailwindcss/vite` plugin (required in vite.config.ts)
- Radix UI components in `src/app/components/ui/` (pre-generated primitives)
- Color palette: Blue accents (`blue-600`, `blue-700`), gray neutrals (`gray-50` to `gray-800`), green for success (`green-500`)
- Use `motion` package (imported as `import { motion, AnimatePresence } from 'motion/react'`) for:
  - Item entrance: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
  - Item exit: `exit={{ opacity: 0, scale: 0.95 }}`
  - Layout animations: `layout` prop on motion.div

### State Updates Pattern
Always use functional setState to ensure immutability:
```tsx
setItems(prev => prev.map(item => 
  item.id === id ? { ...item, completed: !item.completed } : item
));
```

### Form Handling
Use `ItemForm` component for all item/ingredient input (reused in AddItem and AddRecipeModal). It includes supermarket selection dropdown with auto-suggesting known stores.

### localStorage Keys
- `'grocery-list'`: JSON stringified items array
- `'known-supermarkets'`: JSON stringified stores array
- `'grocery-recipes'`: JSON stringified recipes array
- Always wrap parse/stringify in try-catch to handle corrupted data

## Development Workflow

**Commands:**
```bash
npm i              # Install dependencies (uses pnpm overrides for vite@6.3.5)
npm run dev        # Start Vite dev server (HMR enabled)
npm run build      # Production build to dist/
```

**Path Alias:**
- `@/` maps to `src/` (configured in `vite.config.ts`)
- Use this for all imports: `import { GroceryItem } from '@/app/components/GroceryItem'`

**Key Dependencies:**
- **React 18.3.1**: Core framework
- **Vite 6.3.5**: Build/dev tool (pinned version in pnpm overrides)
- **Radix UI**: Accessible component primitives
- **motion/react**: Animation library (formerly Framer Motion)
- **Tailwind CSS 4.1.12**: Styling
- **lucide-react**: Icons (used: ShoppingBasket, Store, CheckCircle2, Plus, Download, etc.)
- **react-dnd**: Drag-and-drop foundation (installed but check current usage)

## Integration Points & Patterns

### Modal Dialogs
All modals use Radix UI Dialog with consistent structure:
```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription className="sr-only">...</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>...</DialogFooter>
  </DialogContent>
</Dialog>
```

### Component File Organization
- One component per file in `src/app/components/`
- UI primitives in `src/app/components/ui/` (auto-generated from shadcn pattern)
- Figma-specific utilities in `src/app/components/figma/`

### Styling Files
- `styles/index.css`: Main entry (imports all CSS layers)
- `styles/tailwind.css`: Tailwind directives and layer definitions
- `styles/theme.css`: Color variables and custom theme tokens
- `styles/fonts.css`: Font declarations (check for @font-face imports)

## Common Tasks

**Adding a new store to defaults:**
Edit `DEFAULT_STORES` array in `App.tsx` (currently: Costco, Trader Joe's, 99 Ranch, H mart)

**Creating a new item UI variation:**
Modify `GroceryItem.tsx` className logic; reference `highlightColor` prop for store-specific coloring

**Persisting new data type:**
1. Add to App state
2. Add localStorage get/set in useEffect hooks (follow existing pattern with try-catch)
3. Update TypeScript interfaces at top of App.tsx

**Handling recipe ingredients:**
Always map through `ingredients[]` when processing; each ingredient has `{id, name, supermarket}` structure matching Item fields

## Notes for AI Agents
- This is a Figma-generated project; some components may have design system integration comments
- The Guidelines.md file is a template—actual guidelines may need to be added by the team
- Focus on maintaining localStorage persistence in all CRUD operations
- Test state with localStorage inspection in DevTools to verify serialization
- Keep component file sizes small; extract reusable logic to separate functions

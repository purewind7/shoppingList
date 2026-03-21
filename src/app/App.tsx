'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBasket, LayoutGrid, Store, Search, BookOpen, Plus, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
  type ApiBootstrap,
  clearCompletedItems,
  createItem,
  createRecipe,
  createStore,
  deleteItemApi,
  deleteRecipeApi,
  deleteStoreApi,
  getBootstrap,
  importItems,
  updateItem,
  updateRecipeApi,
} from '@/lib/apiClient';
import {
  clearBootstrapCache,
  readBootstrapCache,
  touchBootstrapCache,
  writeBootstrapCache,
} from '@/lib/bootstrapCache';
import { GroceryItem } from '@/app/components/GroceryItem';
import { AddItem } from '@/app/components/AddItem';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { RecipeList } from '@/app/components/RecipeList';
import { ClearDoneButton } from '@/app/components/ClearDoneButton';
import { FooterStatsBar } from '@/app/components/FooterStatsBar';
import { RefreshButton } from '@/app/components/RefreshButton';
import { AddRecipeModal } from '@/app/components/AddRecipeModal';
import { RecipeImportModal } from '@/app/components/RecipeImportModal';
import { EditItemModal } from '@/app/components/EditItemModal';
import { LogoutButton } from '@/app/components/LogoutButton';
import { ScrollToTopButton } from '@/app/components/ScrollToTopButton';
import { StoreManagerModal } from '@/app/components/StoreManagerModal';
import { ITEM_COLORS } from '@/app/colors';

interface Item {
  id: string;
  name: string;
  supermarket: string;
  completed: boolean;
  createdAt: number;
}

interface Ingredient {
  id: string;
  name: string;
  supermarket: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  notes?: string;
  createdAt: number;
}

interface RemovedItemSuggestion {
  name: string;
  supermarket: string;
}

type TabType = 'all' | 'by-store' | 'recipes';
const TAB_ORDER: TabType[] = ['all', 'by-store', 'recipes'];

const DEFAULT_STORES = ['Costco', "Trader Joe's", '99 Ranch', 'H mart'];
const TAB_SWIPE_DISTANCE = 36;
const TOGGLE_SYNC_DELAY_MS = 300;
const BOOTSTRAP_REVALIDATE_TTL_MS = 60_000;

const tabMotionVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? TAB_SWIPE_DISTANCE : -TAB_SWIPE_DISTANCE,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -TAB_SWIPE_DISTANCE : TAB_SWIPE_DISTANCE,
  }),
};

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [knownStores, setKnownStores] = useState<string[]>([]);
  const [removedSuggestions, setRemovedSuggestions] = useState<RemovedItemSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tabTransitionDir, setTabTransitionDir] = useState(0);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const toggleSyncTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingToggleValueRef = useRef<Record<string, boolean>>({});
  const toggleInFlightRef = useRef<Set<string>>(new Set());
  const hasHydratedSnapshotRef = useRef(false);
  const bootstrapRevalidateAtRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const applyBootstrapPayload = useCallback(
    (payload: ApiBootstrap) => {
      setItems(payload.items);
      setRecipes(payload.recipes);
      setKnownStores(payload.stores);
      setRemovedSuggestions(payload.removedSuggestions ?? []);
      hasHydratedSnapshotRef.current = true;
    },
    []
  );

  const getBootstrapSnapshot = useCallback(
    (overrides?: Partial<ApiBootstrap>): ApiBootstrap => ({
      items: overrides?.items ?? items,
      recipes: overrides?.recipes ?? recipes,
      stores: overrides?.stores ?? knownStores,
      removedSuggestions: overrides?.removedSuggestions ?? removedSuggestions,
    }),
    [items, recipes, knownStores, removedSuggestions]
  );

  const persistBootstrapSnapshot = useCallback(
    (overrides?: Partial<ApiBootstrap>, cachedAt = Date.now(), etag: string | null = null) => {
      const userId = session?.user?.id;
      if (!userId || !hasHydratedSnapshotRef.current) return;

      writeBootstrapCache(userId, getBootstrapSnapshot(overrides), cachedAt, etag);
    },
    [getBootstrapSnapshot, session?.user?.id]
  );

  const loadData = useCallback(
    async (options?: { preferCache?: boolean; reason?: string }) => {
      const userId = session?.user?.id;
      if (!userId) {
        hasHydratedSnapshotRef.current = false;
        bootstrapRevalidateAtRef.current = 0;
        setItems([]);
        setRecipes([]);
        setKnownStores([]);
        setRemovedSuggestions([]);
        return;
      }

      const preferCache = options?.preferCache ?? false;
      const reason = options?.reason ?? 'manual';
      let cachedSnapshot = readBootstrapCache(userId);

      if (preferCache) {
        if (cachedSnapshot) {
          console.info('[app][bootstrap] hydrating from cache', {
            userId,
            cachedAt: new Date(cachedSnapshot.cachedAt).toISOString(),
            etag: cachedSnapshot.etag,
            reason,
          });
          applyBootstrapPayload(cachedSnapshot.payload);
        } else {
          console.info('[app][bootstrap] no cache available', { userId, reason });
        }
      }

      setDataLoading(true);
      try {
        const response = await getBootstrap(cachedSnapshot?.etag ?? undefined);
        const fetchedAt = Date.now();
        bootstrapRevalidateAtRef.current = fetchedAt;

        if (response.status === 'not-modified') {
          console.info('[app][bootstrap] not modified', {
            userId,
            fetchedAt: new Date(fetchedAt).toISOString(),
            reason,
            etag: response.etag ?? cachedSnapshot?.etag ?? null,
          });
          touchBootstrapCache(userId, fetchedAt, response.etag ?? cachedSnapshot?.etag ?? null);
          return;
        }

        console.info('[app][bootstrap] synced fresh data', {
          userId,
          fetchedAt: new Date(fetchedAt).toISOString(),
          reason,
          etag: response.etag,
          items: response.payload.items.length,
          recipes: response.payload.recipes.length,
          stores: response.payload.stores.length,
        });
        applyBootstrapPayload(response.payload);
        writeBootstrapCache(userId, response.payload, fetchedAt, response.etag);
      } catch (error) {
        console.error(error);
        console.info('[app][bootstrap] sync failed', {
          userId,
          reason,
          hasCache: Boolean(cachedSnapshot),
        });
      } finally {
        setDataLoading(false);
      }
    },
    [applyBootstrapPayload, session?.user?.id]
  );

  useEffect(() => {
    void loadData({ preferCache: true, reason: 'initial' });
  }, [loadData]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const shouldRevalidate = () =>
      Date.now() - bootstrapRevalidateAtRef.current > BOOTSTRAP_REVALIDATE_TTL_MS;

    const handleFocus = () => {
      if (!shouldRevalidate()) return;
      void loadData({ reason: 'window-focus' });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !shouldRevalidate()) return;
      void loadData({ reason: 'visibility' });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData, session?.user?.id]);

  useEffect(() => {
    return () => {
      Object.values(toggleSyncTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const flushToggleUpdate = useCallback(
    async (id: string) => {
      if (toggleInFlightRef.current.has(id)) return;

      const desiredCompleted = pendingToggleValueRef.current[id];
      if (desiredCompleted === undefined) return;
      delete pendingToggleValueRef.current[id];

      toggleInFlightRef.current.add(id);
      try {
        const updated = await updateItem(id, { completed: desiredCompleted });
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (error) {
        console.error(error);
        await loadData();
      } finally {
        toggleInFlightRef.current.delete(id);
      }

      if (pendingToggleValueRef.current[id] !== undefined) {
        if (toggleSyncTimersRef.current[id]) {
          clearTimeout(toggleSyncTimersRef.current[id]);
        }
        toggleSyncTimersRef.current[id] = setTimeout(() => {
          void flushToggleUpdate(id);
        }, TOGGLE_SYNC_DELAY_MS);
      }
    },
    [loadData]
  );

  const uniqueSupermarkets = useMemo(() => {
    const stores = new Set<string>(DEFAULT_STORES);

    knownStores.forEach((store) => {
      const trimmed = store.trim();
      if (trimmed) stores.add(trimmed);
    });

    return Array.from(stores).sort((a, b) => a.localeCompare(b));
  }, [knownStores]);

  const managedStores = useMemo(() => {
    const stores = new Set<string>(DEFAULT_STORES);
    knownStores.forEach((store) => {
      const trimmed = store.trim();
      if (trimmed) stores.add(trimmed);
    });
    return Array.from(stores).sort((a, b) => a.localeCompare(b));
  }, [knownStores]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supermarket.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsByStore = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    filteredItems.forEach((item) => {
      const stores = item.supermarket.split(',').map((s) => s.trim()).filter(Boolean);
      stores.forEach((store) => {
        if (!grouped[store]) grouped[store] = [];
        grouped[store].push(item);
      });
    });
    return grouped;
  }, [filteredItems]);

  const itemColorMap = useMemo(() => {
    const nameToStores: Record<string, Set<string>> = {};

    items.forEach((item) => {
      const normalizedName = item.name.trim().toLowerCase();
      const stores = item.supermarket.split(',').map((s) => s.trim()).filter(Boolean);

      if (!nameToStores[normalizedName]) {
        nameToStores[normalizedName] = new Set();
      }
      stores.forEach((store) => nameToStores[normalizedName].add(store));
    });

    const colorMap: Record<string, string> = {};
    const multiStoreNames = Object.keys(nameToStores)
      .filter((name) => nameToStores[name].size > 1)
      .sort();

    multiStoreNames.forEach((name, index) => {
      colorMap[name] = ITEM_COLORS[index % ITEM_COLORS.length];
    });

    return colorMap;
  }, [items]);

  const addItem = async (name: string, supermarket: string) => {
    if (!session?.user) return;
    try {
      const item = await createItem({ name, supermarket: supermarket || 'General' });
      const nextItems = [item, ...items];
      setItems(nextItems);
      persistBootstrapSnapshot({ items: nextItems });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditItem = async (id: string, name: string, supermarket: string) => {
    try {
      const updated = await updateItem(id, { name, supermarket: supermarket || 'General' });
      const nextItems = items.map((item) => (item.id === id ? updated : item));
      setItems(nextItems);
      persistBootstrapSnapshot({ items: nextItems });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStore = async (storeName: string) => {
    if (!session?.user) return;
    const normalized = storeName.trim();
    if (!normalized || normalized.includes(',')) return;

    const existing = new Set(
      [...DEFAULT_STORES, ...knownStores].map((store) => store.toLowerCase())
    );
    if (existing.has(normalized.toLowerCase())) return;

    try {
      const data = await createStore(normalized);
      if (data?.name) {
        const nextStores = Array.from(new Set([...knownStores, data.name]));
        setKnownStores(nextStores);
        persistBootstrapSnapshot({ stores: nextStores });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveStore = async (storeName: string) => {
    if (!session?.user) return;
    const trimmed = storeName.trim();
    if (!trimmed) return;
    if (DEFAULT_STORES.some((store) => store.toLowerCase() === trimmed.toLowerCase())) return;

    try {
      await deleteStoreApi(trimmed);
      const nextStores = knownStores.filter((store) => store.toLowerCase() !== trimmed.toLowerCase());
      setKnownStores(nextStores);
      persistBootstrapSnapshot({ stores: nextStores });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRecipe = async (name: string, ingredients: Ingredient[], notes: string) => {
    if (!session?.user) return;

    try {
      const recipe = await createRecipe({ name, notes, ingredients });
      const nextRecipes = [recipe, ...recipes];
      setRecipes(nextRecipes);
      persistBootstrapSnapshot({ recipes: nextRecipes });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipeApi(id);
      const nextRecipes = recipes.filter((recipe) => recipe.id !== id);
      setRecipes(nextRecipes);
      persistBootstrapSnapshot({ recipes: nextRecipes });
    } catch (error) {
      console.error(error);
    }
  };

  const handleImportIngredients = async (ingredients: Ingredient[]) => {
    if (!session?.user || ingredients.length === 0) return;

    try {
      const newItems = await importItems(ingredients);
      const nextItems = [...newItems, ...items];
      setItems(nextItems);
      persistBootstrapSnapshot({ items: nextItems });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleItem = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;
    const nextItems = items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, completed: nextCompleted };
    });

    setItems(nextItems);
    persistBootstrapSnapshot({ items: nextItems });

    pendingToggleValueRef.current[id] = nextCompleted;

    if (toggleSyncTimersRef.current[id]) {
      clearTimeout(toggleSyncTimersRef.current[id]);
    }
    toggleSyncTimersRef.current[id] = setTimeout(() => {
      void flushToggleUpdate(id);
    }, TOGGLE_SYNC_DELAY_MS);
  };

  const deleteItem = async (id: string) => {
    try {
      if (toggleSyncTimersRef.current[id]) {
        clearTimeout(toggleSyncTimersRef.current[id]);
        delete toggleSyncTimersRef.current[id];
      }
      delete pendingToggleValueRef.current[id];

      const result = await deleteItemApi(id);
      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);
      const removed = result.removedSuggestion;
      if (removed?.name) {
        const next = new Map<string, RemovedItemSuggestion>();
        removedSuggestions.forEach((entry) => next.set(entry.name.trim().toLowerCase(), entry));
        next.set(removed.name.trim().toLowerCase(), removed);
        const nextSuggestions = Array.from(next.values());
        setRemovedSuggestions(nextSuggestions);
        persistBootstrapSnapshot({ items: nextItems, removedSuggestions: nextSuggestions });
      } else {
        persistBootstrapSnapshot({ items: nextItems });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const clearCompleted = async () => {
    if (!session?.user) return;
    try {
      items
        .filter((item) => item.completed)
        .forEach((item) => {
          if (toggleSyncTimersRef.current[item.id]) {
            clearTimeout(toggleSyncTimersRef.current[item.id]);
            delete toggleSyncTimersRef.current[item.id];
          }
          delete pendingToggleValueRef.current[item.id];
        });

      const result = await clearCompletedItems();
      const nextItems = items.filter((item) => !item.completed);
      setItems(nextItems);
      const merged = new Map<string, RemovedItemSuggestion>();
      removedSuggestions.forEach((entry) => merged.set(entry.name.trim().toLowerCase(), entry));
      (result.removedSuggestions ?? []).forEach((entry) => {
        merged.set(entry.name.trim().toLowerCase(), entry);
      });
      const nextSuggestions = Array.from(merged.values());
      setRemovedSuggestions(nextSuggestions);
      persistBootstrapSnapshot({ items: nextItems, removedSuggestions: nextSuggestions });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    const userId = session?.user?.id;
    const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
    if (globalError && globalError.code !== 'session_not_found') {
      console.error(globalError);
    }
    const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
    if (localError) {
      console.error(localError);
    }
    if (userId) {
      clearBootstrapCache(userId);
    }
    hasHydratedSnapshotRef.current = false;
    bootstrapRevalidateAtRef.current = 0;
    setSession(null);
    setItems([]);
    setRecipes([]);
    setKnownStores([]);
    setRemovedSuggestions([]);
  };

  const handleUpdateRecipe = async (id: string, name: string, ingredients: Ingredient[], notes: string) => {
    try {
      const updated = await updateRecipeApi(id, { name, notes, ingredients });
      const nextRecipes = recipes.map((recipe) => (recipe.id === id ? updated : recipe));
      setRecipes(nextRecipes);
      persistBootstrapSnapshot({ recipes: nextRecipes });
    } catch (error) {
      console.error(error);
    }
  };

  const completedCount = items.filter((item) => item.completed).length;
  const userDisplayName = (session?.user.email?.split('@')[0] || 'My').trim() || 'My';

  const switchTab = (nextTab: TabType) => {
    if (nextTab === activeTab) return;
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const nextIndex = TAB_ORDER.indexOf(nextTab);
    setTabTransitionDir(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartXRef.current = event.touches[0]?.clientX ?? null;
    swipeStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSwipeEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null || swipeStartYRef.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? swipeStartXRef.current;
    const endY = event.changedTouches[0]?.clientY ?? swipeStartYRef.current;
    const deltaX = endX - swipeStartXRef.current;
    const deltaY = endY - swipeStartYRef.current;

    swipeStartXRef.current = null;
    swipeStartYRef.current = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > 40) return;

    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (deltaX < 0 && currentIndex < TAB_ORDER.length - 1) {
      switchTab(TAB_ORDER[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      switchTab(TAB_ORDER[currentIndex - 1]);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-gray-600">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-gray-900">Shopping Notes</h1>
            <p className="text-gray-500 mt-2">Sign in to sync your list across devices.</p>
          </div>
          <div className="space-y-4">
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                disabled={authLoading}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-60"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <RefreshButton isLoading={dataLoading} onClick={() => void loadData({ reason: 'manual-refresh' })} />
        <LogoutButton onClick={handleSignOut} />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1610636996379-4d184e2ef20a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGdyb2NlcmllcyUyMG1hcmtldHxlbnwxfHx8fDE3Njk3Mjg5MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Groceries"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-white drop-shadow-md">{userDisplayName}&apos;s Groceries</h1>
            <p className="text-white/90 font-medium">
              {items.length} items total • {completedCount} done
            </p>
          </div>
          <ClearDoneButton isVisible={completedCount > 0} onClick={clearCompleted} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4 relative z-10">
        <div className="sticky top-4 z-30 mb-6 space-y-4">
          {/* Main Action Area */}
          {activeTab === 'recipes' ? (
            <div>
              <button
                onClick={() => setIsRecipeModalOpen(true)}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Add New Recipe
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <AddItem
                onAdd={addItem}
                supermarkets={uniqueSupermarkets}
                onManageStores={() => setIsStoreModalOpen(true)}
                itemNameSuggestions={removedSuggestions}
              />
            </div>
          )}

          {/* Search & Tabs */}
          <div className="bg-white/95 p-2 rounded-2xl shadow-sm border border-gray-100 backdrop-blur-sm">
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => switchTab('all')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                All Items
              </button>
              <button
                onClick={() => switchTab('by-store')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'by-store'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Store className="w-4 h-4" />
                By Store
              </button>
              <button
                onClick={() => switchTab('recipes')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'recipes'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Recipes
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, stores or recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Import Recipe Button (Only in All Items) */}
        {activeTab === 'all' && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Import from Recipe
            </button>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
          <AnimatePresence mode="wait" custom={tabTransitionDir} initial={false}>
            {activeTab === 'all' && (
              <motion.div
                key="all-list"
                custom={tabTransitionDir}
                variants={tabMotionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-1"
              >
                {filteredItems.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBasket className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No items found</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onEdit={(id) => {
                        const target = items.find((entry) => entry.id === id);
                        if (target) setEditingItem(target);
                      }}
                      onDelete={deleteItem}
                    />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'by-store' && (
              <motion.div
                key="store-list"
                custom={tabTransitionDir}
                variants={tabMotionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-8"
              >
                {Object.keys(itemsByStore).length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 font-medium">No stores listed yet</p>
                  </div>
                ) : (
                  Object.entries(itemsByStore)
                    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
                    .map(([store, storeItems]) => (
                      <div key={store} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-1 h-5 bg-blue-500 rounded-full" />
                          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {store}
                            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {storeItems.length}
                            </span>
                          </h2>
                        </div>
                        <div className="space-y-1">
                          {storeItems.map((item) => (
                            <GroceryItem
                              key={item.id}
                              item={item}
                              onToggle={toggleItem}
                              onEdit={(id) => {
                                const target = items.find((entry) => entry.id === id);
                                if (target) setEditingItem(target);
                              }}
                              onDelete={deleteItem}
                              highlightColor={itemColorMap[item.name.trim().toLowerCase()]}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </motion.div>
            )}

            {activeTab === 'recipes' && (
              <motion.div
                key="recipe-list"
                custom={tabTransitionDir}
                variants={tabMotionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <RecipeList
                  recipes={recipes}
                  onDelete={handleDeleteRecipe}
                  onEdit={(id) => {
                    const target = recipes.find((entry) => entry.id === id);
                    if (target) setEditingRecipe(target);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FooterStatsBar totalCount={items.length} completedCount={completedCount} />

      <ScrollToTopButton
        isVisible={showScrollTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Modals */}
      <AddRecipeModal
        isOpen={isRecipeModalOpen || Boolean(editingRecipe)}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setEditingRecipe(null);
        }}
        onSave={(name, ingredients, notes) => {
          if (editingRecipe) {
            handleUpdateRecipe(editingRecipe.id, name, ingredients, notes);
            setEditingRecipe(null);
          } else {
            handleAddRecipe(name, ingredients, notes);
          }
        }}
        supermarkets={uniqueSupermarkets}
        onManageStores={() => setIsStoreModalOpen(true)}
        initialName={editingRecipe?.name ?? ''}
        initialIngredients={editingRecipe?.ingredients ?? []}
        initialNotes={editingRecipe?.notes ?? ''}
        submitLabel={editingRecipe ? 'Update Recipe' : 'Save Recipe'}
        title={editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
      />

      <RecipeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        recipes={recipes}
        onImport={handleImportIngredients}
      />

      <StoreManagerModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        stores={managedStores}
        defaultStores={DEFAULT_STORES}
        onAddStore={handleAddStore}
        onRemoveStore={handleRemoveStore}
      />

      <EditItemModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={(name, supermarket) => {
          if (editingItem) {
            handleEditItem(editingItem.id, name, supermarket);
          }
        }}
        supermarkets={uniqueSupermarkets}
        onManageStores={() => setIsStoreModalOpen(true)}
        initialName={editingItem?.name ?? ''}
        initialSupermarkets={
          editingItem?.supermarket
            ? editingItem.supermarket.split(',').map((s) => s.trim()).filter(Boolean)
            : []
        }
      />
    </div>
  );
}

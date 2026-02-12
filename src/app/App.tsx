'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBasket, LayoutGrid, Store, Search, BookOpen, Plus, Download, LogOut, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { GroceryItem } from '@/app/components/GroceryItem';
import { AddItem } from '@/app/components/AddItem';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { RecipeList } from '@/app/components/RecipeList';
import { AddRecipeModal } from '@/app/components/AddRecipeModal';
import { RecipeImportModal } from '@/app/components/RecipeImportModal';
import { EditItemModal } from '@/app/components/EditItemModal';
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

type TabType = 'all' | 'by-store' | 'recipes';
const TAB_ORDER: TabType[] = ['all', 'by-store', 'recipes'];

const DEFAULT_STORES = ['Costco', "Trader Joe's", '99 Ranch', 'H mart'];

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [knownStores, setKnownStores] = useState<string[]>([]);
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

  const loadData = useCallback(async () => {
    if (!session?.user) {
      setItems([]);
      setRecipes([]);
      setKnownStores([]);
      return;
    }

    setDataLoading(true);

    const [itemsResult, recipesResult, storesResult] = await Promise.all([
      supabase
        .from('grocery_items')
        .select('id,name,supermarket,completed,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('recipes')
        .select('id,name,notes,created_at,recipe_ingredients(id,name,supermarket)')
        .order('created_at', { ascending: false }),
      supabase
        .from('stores')
        .select('name')
        .order('created_at', { ascending: false }),
    ]);

      const itemRows = itemsResult.data ?? [];
      if (itemsResult.error) {
        console.error(itemsResult.error);
      } else if (itemRows.length) {
        setItems(
          itemRows.map((row) => ({
            id: row.id,
            name: row.name,
            supermarket: row.supermarket ?? 'General',
            completed: row.completed,
            createdAt: new Date(row.created_at).getTime(),
          }))
        );
      }

      if (recipesResult.error) {
        console.error(recipesResult.error);
      } else if (recipesResult.data) {
        setRecipes(
          recipesResult.data.map((row) => ({
            id: row.id,
            name: row.name,
            notes: row.notes ?? '',
            createdAt: new Date(row.created_at).getTime(),
            ingredients:
              row.recipe_ingredients?.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
                supermarket: ingredient.supermarket ?? 'General',
              })) ?? [],
          }))
        );
      }

      const dbStores = storesResult.data ?? [];
      if (storesResult.error) {
        console.error(storesResult.error);
      } else if (dbStores.length) {
        const storeNames = dbStores
          .flatMap((row) => row.name?.split(',') ?? [])
          .map((name) => name.trim())
          .filter(Boolean);
        setKnownStores(Array.from(new Set(storeNames)));
      }

      if (itemRows.length) {
        const storeFromItems = itemRows
          .flatMap((row) => row.supermarket?.split(',') ?? [])
          .map((name) => name.trim())
          .filter(Boolean);
        const existing = new Set(
          [...DEFAULT_STORES, ...dbStores.map((row) => row.name ?? '')]
            .map((store) => store.trim())
            .filter(Boolean)
            .map((store) => store.toLowerCase())
        );
        const missingStores = Array.from(new Set(storeFromItems)).filter(
          (store) => !existing.has(store.toLowerCase())
        );

        if (missingStores.length > 0 && session?.user) {
          const { data, error } = await supabase
            .from('stores')
            .insert(missingStores.map((name) => ({ user_id: session.user.id, name })))
            .select('name');

          if (error) {
            console.error(error);
          } else if (data?.length) {
            setKnownStores((prev) => {
              const next = new Set(prev);
              data.forEach((row) => {
                if (row.name) next.add(row.name);
              });
              return Array.from(next);
            });
          }
        }
      }

    setDataLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueSupermarkets = useMemo(() => {
    const stores = new Set<string>(DEFAULT_STORES);

    knownStores.forEach((store) => {
      const trimmed = store.trim();
      if (trimmed) stores.add(trimmed);
    });

    items.forEach((item) => {
      item.supermarket
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((store) => stores.add(store));
    });

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const trimmed = ingredient.supermarket?.trim();
        if (trimmed) stores.add(trimmed);
      });
    });

    return Array.from(stores).sort((a, b) => a.localeCompare(b));
  }, [items, recipes, knownStores]);

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

    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        user_id: session.user.id,
        name,
        supermarket: supermarket || 'General',
      })
      .select('id,name,supermarket,completed,created_at')
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setItems((prev) => [
      {
        id: data.id,
        name: data.name,
        supermarket: data.supermarket ?? 'General',
        completed: data.completed,
        createdAt: new Date(data.created_at).getTime(),
      },
      ...prev,
    ]);
  };

  const handleEditItem = async (id: string, name: string, supermarket: string) => {
    const { data, error } = await supabase
      .from('grocery_items')
      .update({ name, supermarket: supermarket || 'General' })
      .eq('id', id)
      .select('id,name,supermarket,completed,created_at')
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              id: data.id,
              name: data.name,
              supermarket: data.supermarket ?? 'General',
              completed: data.completed,
              createdAt: new Date(data.created_at).getTime(),
            }
          : item
      )
    );
  };

  const handleAddStore = async (storeName: string) => {
    if (!session?.user) return;
    const normalizedStores = storeName
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (normalizedStores.length === 0) return;

    const existing = new Set(
      [...DEFAULT_STORES, ...knownStores].map((store) => store.toLowerCase())
    );
    const toInsert = normalizedStores.filter(
      (store) => !existing.has(store.toLowerCase())
    );

    if (toInsert.length === 0) return;

    const { data, error } = await supabase
      .from('stores')
      .insert(toInsert.map((name) => ({ user_id: session.user.id, name })))
      .select('name');

    if (error) {
      console.error(error);
      return;
    }

    if (data?.length) {
      setKnownStores((prev) => {
        const next = new Set(prev);
        data.forEach((row) => {
          if (row.name) next.add(row.name);
        });
        return Array.from(next);
      });
    }
  };

  const handleRemoveStore = async (storeName: string) => {
    if (!session?.user) return;
    const trimmed = storeName.trim();
    if (!trimmed) return;
    if (DEFAULT_STORES.some((store) => store.toLowerCase() === trimmed.toLowerCase())) return;

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('user_id', session.user.id)
      .eq('name', trimmed);

    if (error) {
      console.error(error);
      return;
    }

    setKnownStores((prev) => prev.filter((store) => store.toLowerCase() !== trimmed.toLowerCase()));
  };

  const handleAddRecipe = async (name: string, ingredients: Ingredient[], notes: string) => {
    if (!session?.user) return;

    const { data: recipeRow, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: session.user.id,
        name,
        notes,
      })
      .select('id,name,notes,created_at')
      .single();

    if (recipeError || !recipeRow) {
      console.error(recipeError);
      return;
    }

    const { data: ingredientRows, error: ingredientError } = await supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map((ingredient) => ({
          recipe_id: recipeRow.id,
          name: ingredient.name,
          supermarket: ingredient.supermarket || 'General',
        }))
      )
      .select('id,name,supermarket');

    if (ingredientError) {
      console.error(ingredientError);
      return;
    }

    setRecipes((prev) => [
      {
        id: recipeRow.id,
        name: recipeRow.name,
        notes: recipeRow.notes ?? '',
        createdAt: new Date(recipeRow.created_at).getTime(),
        ingredients:
          ingredientRows?.map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.name,
            supermarket: ingredient.supermarket ?? 'General',
          })) ?? [],
      },
      ...prev,
    ]);
  };

  const handleDeleteRecipe = async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  const handleImportIngredients = async (ingredients: Ingredient[]) => {
    if (!session?.user || ingredients.length === 0) return;

    const { data, error } = await supabase
      .from('grocery_items')
      .insert(
        ingredients.map((ingredient) => ({
          user_id: session.user.id,
          name: ingredient.name,
          supermarket: ingredient.supermarket || 'General',
        }))
      )
      .select('id,name,supermarket,completed,created_at');

    if (error) {
      console.error(error);
      return;
    }

    const newItems =
      data?.map((row) => ({
        id: row.id,
        name: row.name,
        supermarket: row.supermarket ?? 'General',
        completed: row.completed,
        createdAt: new Date(row.created_at).getTime(),
      })) ?? [];

    setItems((prev) => [...newItems, ...prev]);
  };

  const toggleItem = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const { data, error } = await supabase
      .from('grocery_items')
      .update({ completed: !target.completed })
      .eq('id', id)
      .select('id,completed')
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: data.completed } : item))
    );
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompleted = async () => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('user_id', session.user.id)
      .eq('completed', true);

    if (error) {
      console.error(error);
      return;
    }

    setItems((prev) => prev.filter((item) => !item.completed));
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
    const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
    if (globalError && globalError.code !== 'session_not_found') {
      console.error(globalError);
    }
    const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
    if (localError) {
      console.error(localError);
    }
    setSession(null);
    setItems([]);
    setRecipes([]);
    setKnownStores([]);
  };

  const handleUpdateRecipe = async (id: string, name: string, ingredients: Ingredient[], notes: string) => {
    const { data: recipeRow, error: recipeError } = await supabase
      .from('recipes')
      .update({ name, notes })
      .eq('id', id)
      .select('id,name,notes,created_at')
      .single();

    if (recipeError || !recipeRow) {
      console.error(recipeError);
      return;
    }

    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    if (deleteError) {
      console.error(deleteError);
      return;
    }

    let ingredientRows: Ingredient[] = [];
    if (ingredients.length > 0) {
      const { data, error: ingredientError } = await supabase
        .from('recipe_ingredients')
        .insert(
          ingredients.map((ingredient) => ({
            recipe_id: id,
            name: ingredient.name,
            supermarket: ingredient.supermarket || 'General',
          }))
        )
        .select('id,name,supermarket');

      if (ingredientError) {
        console.error(ingredientError);
        return;
      }

      ingredientRows =
        data?.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          supermarket: ingredient.supermarket ?? 'General',
        })) ?? [];
    }

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === id
          ? {
              id: recipeRow.id,
              name: recipeRow.name,
              notes: recipeRow.notes ?? '',
              createdAt: new Date(recipeRow.created_at).getTime(),
              ingredients: ingredientRows,
            }
          : recipe
      )
    );
  };

  const completedCount = items.filter((item) => item.completed).length;

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
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white/70 backdrop-blur-md rounded-full px-2 py-2">
            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              aria-label="Refresh data"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <span>
              Signed in as <span className="text-gray-900">{session.user.email ?? 'User'}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1610636996379-4d184e2ef20a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGdyb2NlcmllcyUyMG1hcmtldHxlbnwxfHx8fDE3Njk3Mjg5MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Groceries"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-white drop-shadow-md">My Groceries</h1>
            <p className="text-white/90 font-medium">
              {items.length} items total • {completedCount} done
            </p>
          </div>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-bold hover:bg-white/30 transition-all"
            >
              Clear Done
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4 relative z-10">
        {dataLoading && (
          <div className="mb-4 text-sm text-gray-500">Syncing from Supabase…</div>
        )}

        {/* Main Action Area */}
        {activeTab === 'recipes' ? (
          <div className="mb-8">
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
            />
          </div>
        )}

        {/* Search & Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sticky top-4 z-20">
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
                initial={{ opacity: 0, x: tabTransitionDir > 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabTransitionDir > 0 ? -36 : 36 }}
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
                initial={{ opacity: 0, x: tabTransitionDir > 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabTransitionDir > 0 ? -36 : 36 }}
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
                initial={{ opacity: 0, x: tabTransitionDir > 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabTransitionDir > 0 ? -36 : 36 }}
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

      {/* Footer / Stats Floating */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-6 z-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-sm font-bold">{items.length} Total</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-bold">{completedCount} Completed</span>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 sm:hidden z-40 p-3 rounded-full bg-white/90 backdrop-blur-md text-gray-700 shadow-lg border border-white/60 hover:bg-white transition-colors"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <span className="text-lg font-bold">↑</span>
        </button>
      )}

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

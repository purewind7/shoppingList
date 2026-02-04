'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBasket, LayoutGrid, Store, Search, BookOpen, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { GroceryItem } from '@/app/components/GroceryItem';
import { AddItem } from '@/app/components/AddItem';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { RecipeList } from '@/app/components/RecipeList';
import { AddRecipeModal } from '@/app/components/AddRecipeModal';
import { RecipeImportModal } from '@/app/components/RecipeImportModal';

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
  createdAt: number;
}

type TabType = 'all' | 'by-store' | 'recipes';

const DEFAULT_STORES = ['Costco', "Trader Joe's", '99 Ranch', 'H mart'];

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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
    const loadData = async () => {
      if (!session?.user) {
        setItems([]);
        setRecipes([]);
        return;
      }

      setDataLoading(true);

      const [itemsResult, recipesResult] = await Promise.all([
        supabase
          .from('grocery_items')
          .select('id,name,supermarket,completed,created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('recipes')
          .select('id,name,created_at,recipe_ingredients(id,name,supermarket)')
          .order('created_at', { ascending: false }),
      ]);

      if (itemsResult.error) {
        console.error(itemsResult.error);
      } else if (itemsResult.data) {
        setItems(
          itemsResult.data.map((row) => ({
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

      setDataLoading(false);
    };

    loadData();
  }, [session?.user?.id]);

  const uniqueSupermarkets = useMemo(() => {
    const stores = new Set<string>(DEFAULT_STORES);

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
  }, [items, recipes]);

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

    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEEAD',
      '#D4A5A5',
      '#9B59B6',
      '#3498DB',
      '#FF9F43',
      '#54A0FF',
      '#5F27CD',
      '#C4E538',
    ];

    const colorMap: Record<string, string> = {};
    const multiStoreNames = Object.keys(nameToStores)
      .filter((name) => nameToStores[name].size > 1)
      .sort();

    multiStoreNames.forEach((name, index) => {
      colorMap[name] = colors[index % colors.length];
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

  const handleAddRecipe = async (name: string, ingredients: Ingredient[]) => {
    if (!session?.user) return;

    const { data: recipeRow, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: session.user.id,
        name,
      })
      .select('id,name,created_at')
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
    await supabase.auth.signOut();
    setItems([]);
    setRecipes([]);
  };

  const completedCount = items.filter((item) => item.completed).length;

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
          <div className="flex items-center gap-3">
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-bold hover:bg-white/30 transition-all"
              >
                Clear Done
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-bold hover:bg-white/20 transition-all"
            >
              Sign Out
            </button>
          </div>
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
            <AddItem onAdd={addItem} supermarkets={uniqueSupermarkets} />
          </div>
        )}

        {/* Search & Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sticky top-4 z-20">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              All Items
            </button>
            <button
              onClick={() => setActiveTab('by-store')}
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
              onClick={() => setActiveTab('recipes')}
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
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeTab === 'all' && (
              <motion.div
                key="all-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                      onDelete={deleteItem}
                    />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'by-store' && (
              <motion.div
                key="store-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RecipeList recipes={recipes} onDelete={handleDeleteRecipe} />
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

      {/* Modals */}
      <AddRecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onSave={handleAddRecipe}
        supermarkets={uniqueSupermarkets}
      />

      <RecipeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        recipes={recipes}
        onImport={handleImportIngredients}
      />
    </div>
  );
}

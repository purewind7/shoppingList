import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabase, isResponse, jsonError } from '../_lib/supabase';

export async function GET(req: NextRequest) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;

  const [itemsRes, recipesRes, storesRes, suggestionsRes] = await Promise.all([
    supabase
      .from('grocery_items')
      .select('id,name,supermarket,completed,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('recipes')
      .select('id,name,notes,created_at,recipe_ingredients(id,name,supermarket)')
      .order('created_at', { ascending: false }),
    supabase.from('stores').select('name').order('created_at', { ascending: false }),
    supabase
      .from('removed_item_suggestions')
      .select('name,supermarket')
      .order('updated_at', { ascending: false }),
  ]);

  if (itemsRes.error) return jsonError(itemsRes.error.message, 500);
  if (recipesRes.error) return jsonError(recipesRes.error.message, 500);
  if (storesRes.error) return jsonError(storesRes.error.message, 500);
  if (suggestionsRes.error) return jsonError(suggestionsRes.error.message, 500);

  const items = (itemsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    supermarket: row.supermarket ?? 'General',
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
  }));

  const recipes = (recipesRes.data ?? []).map((row) => ({
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
  }));

  const stores = Array.from(
    new Set(
      (storesRes.data ?? [])
        .map((row) => row.name?.trim() ?? '')
        .filter((name) => name && !name.includes(','))
    )
  );

  const removedSuggestions = (suggestionsRes.data ?? []).map((row) => ({
    name: row.name,
    supermarket: row.supermarket ?? 'General',
  }));

  const payload = { items, recipes, stores, removedSuggestions, userId: user.id };
  const etag = `"${createHash('sha1').update(JSON.stringify(payload)).digest('hex')}"`;
  const requestEtag = req.headers.get('if-none-match');

  console.info('[api/bootstrap][GET] loaded', {
    userId: user.id,
    items: items.length,
    recipes: recipes.length,
    stores: stores.length,
    removedSuggestions: removedSuggestions.length,
    etag,
  });

  if (requestEtag === etag) {
    console.info('[api/bootstrap][GET] not modified', { userId: user.id, etag });
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      ETag: etag,
    },
  });
}

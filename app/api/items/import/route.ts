import { NextRequest, NextResponse } from 'next/server';
import { asNonEmptyString } from '../../_lib/validators';
import { getAuthedSupabase, isResponse, jsonError } from '../../_lib/supabase';

export async function POST(req: NextRequest) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  try {
    const payload = body as { ingredients?: Array<{ name?: unknown; supermarket?: unknown }> };
    const ingredients = payload.ingredients ?? [];
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return jsonError('ingredients must be a non-empty array');
    }

    const rows = ingredients.map((ingredient) => {
      const name = asNonEmptyString(ingredient.name, 'ingredient.name');
      const supermarket =
        typeof ingredient.supermarket === 'string' && ingredient.supermarket.trim()
          ? ingredient.supermarket.trim()
          : 'General';
      return { user_id: user.id, name, supermarket };
    });

    const { data, error } = await supabase
      .from('grocery_items')
      .insert(rows)
      .select('id,name,supermarket,completed,created_at');

    if (error) return jsonError(error.message, 500);
    console.info('[api/items/import][POST] imported', { userId: user.id, count: rows.length });

    return NextResponse.json(
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        supermarket: row.supermarket ?? 'General',
        completed: row.completed,
        createdAt: new Date(row.created_at).getTime(),
      }))
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Validation error');
  }
}

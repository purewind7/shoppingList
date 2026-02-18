import { NextRequest, NextResponse } from 'next/server';
import { asNonEmptyString } from '../../_lib/validators';
import { getAuthedSupabase, isResponse, jsonError } from '../../_lib/supabase';

type IngredientInput = { name?: unknown; supermarket?: unknown };
type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;
  const { id } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  try {
    const payload = body as {
      name?: unknown;
      notes?: unknown;
      ingredients?: IngredientInput[];
    };

    const name = asNonEmptyString(payload.name, 'name');
    const notes = typeof payload.notes === 'string' ? payload.notes : '';
    const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];

    const { data: recipeRow, error: recipeError } = await supabase
      .from('recipes')
      .update({ name, notes })
      .eq('id', id)
      .select('id,name,notes,created_at')
      .single();

    if (recipeError || !recipeRow) {
      return jsonError(recipeError?.message ?? 'Failed to update recipe', 500);
    }

    const { error: deleteIngredientsError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);
    if (deleteIngredientsError) return jsonError(deleteIngredientsError.message, 500);

    const normalizedIngredients = ingredients.map((ingredient) => ({
      name: asNonEmptyString(ingredient.name, 'ingredient.name'),
      supermarket:
        typeof ingredient.supermarket === 'string' && ingredient.supermarket.trim()
          ? ingredient.supermarket.trim()
          : 'General',
    }));

    let ingredientRows: { id: string; name: string; supermarket: string }[] = [];
    if (normalizedIngredients.length > 0) {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .insert(
          normalizedIngredients.map((ingredient) => ({
            recipe_id: recipeRow.id,
            name: ingredient.name,
            supermarket: ingredient.supermarket,
          }))
        )
        .select('id,name,supermarket');
      if (error) return jsonError(error.message, 500);
      ingredientRows = data ?? [];
    }

    console.info('[api/recipes/:id][PATCH] updated', { userId: user.id, recipeId: id });

    return NextResponse.json({
      id: recipeRow.id,
      name: recipeRow.name,
      notes: recipeRow.notes ?? '',
      createdAt: new Date(recipeRow.created_at).getTime(),
      ingredients: ingredientRows.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        supermarket: ingredient.supermarket ?? 'General',
      })),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Validation error');
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;
  const { id } = params;

  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) return jsonError(error.message, 500);
  console.info('[api/recipes/:id][DELETE] deleted', { userId: user.id, recipeId: id });
  return NextResponse.json({ ok: true });
}

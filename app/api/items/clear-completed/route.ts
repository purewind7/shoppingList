import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabase, isResponse, jsonError } from '../../_lib/supabase';

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;

  const { data: completedItems, error: fetchError } = await supabase
    .from('grocery_items')
    .select('name,supermarket')
    .eq('user_id', user.id)
    .eq('completed', true);

  if (fetchError) return jsonError(fetchError.message, 500);

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', user.id)
    .eq('completed', true);

  if (error) return jsonError(error.message, 500);

  const normalized = new Map<string, Set<string>>();
  (completedItems ?? []).forEach((item) => {
    const key = item.name.trim().toLowerCase();
    if (!key) return;
    const stores = (item.supermarket ?? 'General')
      .split(',')
      .map((value: string) => value.trim())
      .filter((value: string) => Boolean(value));
    if (!normalized.has(key)) normalized.set(key, new Set());
    stores.forEach((store: string) => normalized.get(key)?.add(store));
  });

  const suggestionRows = Array.from(normalized.entries()).map(([nameKey, stores]) => {
    const originalName =
      (completedItems ?? []).find((item) => item.name.trim().toLowerCase() === nameKey)?.name.trim() ??
      nameKey;
    return {
      user_id: user.id,
      name: originalName,
      supermarket: Array.from(stores).join(', ') || 'General',
      updated_at: new Date().toISOString(),
    };
  });

  if (suggestionRows.length > 0) {
    const { error: upsertError } = await supabase
      .from('removed_item_suggestions')
      .upsert(suggestionRows, { onConflict: 'user_id,name' });

    if (upsertError) return jsonError(upsertError.message, 500);
  }

  console.info('[api/items/clear-completed][DELETE] cleared', { userId: user.id });
  return NextResponse.json({
    ok: true,
    removedSuggestions: suggestionRows.map((row) => ({
      name: row.name,
      supermarket: row.supermarket,
    })),
  });
}

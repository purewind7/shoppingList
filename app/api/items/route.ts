import { NextRequest, NextResponse } from 'next/server';
import { asNonEmptyString } from '../_lib/validators';
import { getAuthedSupabase, isResponse, jsonError } from '../_lib/supabase';

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
    const payload = body as { name?: unknown; supermarket?: unknown };
    const name = asNonEmptyString(payload.name, 'name');
    const supermarketRaw = typeof payload.supermarket === 'string' ? payload.supermarket.trim() : '';

    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        user_id: user.id,
        name,
        supermarket: supermarketRaw || 'General',
      })
      .select('id,name,supermarket,completed,created_at')
      .single();

    if (error || !data) return jsonError(error?.message ?? 'Failed to create item', 500);
    console.info('[api/items][POST] created', { userId: user.id, itemId: data.id });

    return NextResponse.json({
      id: data.id,
      name: data.name,
      supermarket: data.supermarket ?? 'General',
      completed: data.completed,
      createdAt: new Date(data.created_at).getTime(),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Validation error');
  }
}

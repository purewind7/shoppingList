import { NextRequest, NextResponse } from 'next/server';
import { asBoolean, asOptionalString } from '../../_lib/validators';
import { getAuthedSupabase, isResponse, jsonError } from '../../_lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  try {
    const payload = body as { name?: unknown; supermarket?: unknown; completed?: unknown };
    const update: Record<string, string | boolean> = {};

    const name = asOptionalString(payload.name);
    if (name !== null) {
      if (!name) return jsonError('name is required');
      update.name = name;
    }

    const supermarket = asOptionalString(payload.supermarket);
    if (supermarket !== null) {
      update.supermarket = supermarket || 'General';
    }

    if (payload.completed !== undefined) {
      update.completed = asBoolean(payload.completed, 'completed');
    }

    if (Object.keys(update).length === 0) {
      return jsonError('No fields to update');
    }

    const { data, error } = await supabase
      .from('grocery_items')
      .update(update)
      .eq('id', id)
      .select('id,name,supermarket,completed,created_at')
      .single();

    if (error || !data) return jsonError(error?.message ?? 'Failed to update item', 500);
    console.info('[api/items/:id][PATCH] updated', { userId: user.id, itemId: id });

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

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;
  const { id } = await params;

  const { error } = await supabase.from('grocery_items').delete().eq('id', id);
  if (error) return jsonError(error.message, 500);
  console.info('[api/items/:id][DELETE] deleted', { userId: user.id, itemId: id });
  return NextResponse.json({ ok: true });
}

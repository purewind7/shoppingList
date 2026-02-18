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
    const payload = body as { name?: unknown };
    const name = asNonEmptyString(payload.name, 'name');
    if (name.includes(',')) {
      return jsonError('Store name cannot contain commas');
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({ user_id: user.id, name })
      .select('name');

    if (error) return jsonError(error.message, 500);
    console.info('[api/stores][POST] created', { userId: user.id, name });
    return NextResponse.json(data?.[0] ?? { name });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Validation error');
  }
}

export async function DELETE(req: NextRequest) {
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
    const payload = body as { name?: unknown };
    const name = asNonEmptyString(payload.name, 'name');

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name);

    if (error) return jsonError(error.message, 500);
    console.info('[api/stores][DELETE] deleted', { userId: user.id, name });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Validation error');
  }
}

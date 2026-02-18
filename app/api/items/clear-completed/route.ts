import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabase, isResponse, jsonError } from '../../_lib/supabase';

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthedSupabase(req);
  if (isResponse(ctx)) return ctx;
  const { supabase, user } = ctx;

  const { error } = await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', user.id)
    .eq('completed', true);

  if (error) return jsonError(error.message, 500);
  console.info('[api/items/clear-completed][DELETE] cleared', { userId: user.id });
  return NextResponse.json({ ok: true });
}

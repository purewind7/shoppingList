import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export type AuthedContext = {
  supabase: SupabaseClient;
  user: User;
};

export const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function getAuthedSupabase(req: NextRequest): Promise<AuthedContext | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonError('Missing bearer token', 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return jsonError('Invalid bearer token', 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return jsonError('Unauthorized', 401);
  }

  return { supabase, user: data.user };
}

export const isResponse = (value: unknown): value is NextResponse => value instanceof NextResponse;

/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { getAuthedSupabase, isResponse } from '../_lib/supabase';

jest.mock('../_lib/supabase', () => ({
  getAuthedSupabase: jest.fn(),
  isResponse: jest.fn(),
  jsonError: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
}));

describe('GET /api/bootstrap', () => {
  it('returns normalized bootstrap payload including removed suggestions', async () => {
    const groceryRes = {
      data: [
        {
          id: 'item-1',
          name: 'Milk',
          supermarket: 'Costco',
          completed: false,
          created_at: '2026-02-20T00:00:00.000Z',
        },
      ],
      error: null,
    };
    const recipesRes = {
      data: [
        {
          id: 'recipe-1',
          name: 'Pancake',
          notes: '2 eggs',
          created_at: '2026-02-21T00:00:00.000Z',
          recipe_ingredients: [{ id: 'ing-1', name: 'Egg', supermarket: null }],
        },
      ],
      error: null,
    };
    const storesRes = {
      data: [{ name: 'Costco' }, { name: "Trader Joe's" }, { name: 'Costco, Trader Joe\'s' }],
      error: null,
    };
    const suggestionsRes = {
      data: [{ name: 'Milk', supermarket: 'Costco' }],
      error: null,
    };

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'grocery_items') {
          return { select: jest.fn(() => ({ order: jest.fn().mockResolvedValue(groceryRes) })) };
        }
        if (table === 'recipes') {
          return { select: jest.fn(() => ({ order: jest.fn().mockResolvedValue(recipesRes) })) };
        }
        if (table === 'stores') {
          return { select: jest.fn(() => ({ order: jest.fn().mockResolvedValue(storesRes) })) };
        }
        if (table === 'removed_item_suggestions') {
          return { select: jest.fn(() => ({ order: jest.fn().mockResolvedValue(suggestionsRes) })) };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    (isResponse as jest.Mock).mockReturnValue(false);
    (getAuthedSupabase as jest.Mock).mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
    });

    const req = new NextRequest('http://localhost/api/bootstrap');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.userId).toBe('user-1');
    expect(body.items).toHaveLength(1);
    expect(body.recipes).toHaveLength(1);
    expect(body.removedSuggestions).toEqual([{ name: 'Milk', supermarket: 'Costco' }]);
    expect(body.stores).toEqual(['Costco', "Trader Joe's"]);
  });
});

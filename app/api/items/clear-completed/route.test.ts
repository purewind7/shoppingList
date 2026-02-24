/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { DELETE } from './route';
import { getAuthedSupabase, isResponse } from '../../_lib/supabase';

jest.mock('../../_lib/supabase', () => ({
  getAuthedSupabase: jest.fn(),
  isResponse: jest.fn(),
  jsonError: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
}));

describe('DELETE /api/items/clear-completed', () => {
  it('deletes completed items and stores normalized suggestions', async () => {
    const completedItems = [
      { name: 'Apples', supermarket: 'Costco' },
      { name: 'apples', supermarket: "Trader Joe's" },
      { name: 'Bread', supermarket: null },
    ];

    const selectEq2 = jest.fn().mockResolvedValue({ data: completedItems, error: null });
    const selectEq1 = jest.fn().mockReturnValue({ eq: selectEq2 });
    const select = jest.fn().mockReturnValue({ eq: selectEq1 });

    const deleteEq2 = jest.fn().mockResolvedValue({ error: null });
    const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
    const del = jest.fn().mockReturnValue({ eq: deleteEq1 });

    const upsert = jest.fn().mockResolvedValue({ error: null });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'grocery_items') return { select, delete: del };
        if (table === 'removed_item_suggestions') return { upsert };
        throw new Error(`unexpected table ${table}`);
      }),
    };

    (isResponse as jest.Mock).mockReturnValue(false);
    (getAuthedSupabase as jest.Mock).mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
    });

    const req = new NextRequest('http://localhost/api/items/clear-completed', { method: 'DELETE' });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          name: 'Apples',
          supermarket: "Costco, Trader Joe's",
        }),
        expect.objectContaining({
          user_id: 'user-1',
          name: 'Bread',
          supermarket: 'General',
        }),
      ]),
      { onConflict: 'user_id,name' }
    );
    expect(body.ok).toBe(true);
    expect(body.removedSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Apples' }),
        expect.objectContaining({ name: 'Bread' }),
      ])
    );
  });
});

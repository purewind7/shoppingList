import { supabase } from '@/lib/supabaseClient';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Missing auth session');
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep fallback status message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export type ApiItem = {
  id: string;
  name: string;
  supermarket: string;
  completed: boolean;
  createdAt: number;
};

export type ApiIngredient = {
  id: string;
  name: string;
  supermarket: string;
};

export type ApiRecipe = {
  id: string;
  name: string;
  notes?: string;
  ingredients: ApiIngredient[];
  createdAt: number;
};

export type ApiBootstrap = {
  items: ApiItem[];
  recipes: ApiRecipe[];
  stores: string[];
};

export const getBootstrap = () => apiRequest<ApiBootstrap>('/api/bootstrap');

export const createItem = (payload: { name: string; supermarket: string }) =>
  apiRequest<ApiItem>('/api/items', { method: 'POST', body: payload });

export const updateItem = (
  id: string,
  payload: { name?: string; supermarket?: string; completed?: boolean }
) => apiRequest<ApiItem>(`/api/items/${id}`, { method: 'PATCH', body: payload });

export const deleteItemApi = (id: string) =>
  apiRequest<{ ok: true }>(`/api/items/${id}`, { method: 'DELETE' });

export const clearCompletedItems = () =>
  apiRequest<{ ok: true }>('/api/items/clear-completed', { method: 'DELETE' });

export const importItems = (ingredients: Array<{ name: string; supermarket: string }>) =>
  apiRequest<ApiItem[]>('/api/items/import', { method: 'POST', body: { ingredients } });

export const createStore = (name: string) =>
  apiRequest<{ name: string }>('/api/stores', { method: 'POST', body: { name } });

export const deleteStoreApi = (name: string) =>
  apiRequest<{ ok: true }>('/api/stores', { method: 'DELETE', body: { name } });

export const createRecipe = (payload: {
  name: string;
  notes: string;
  ingredients: Array<{ name: string; supermarket: string }>;
}) => apiRequest<ApiRecipe>('/api/recipes', { method: 'POST', body: payload });

export const updateRecipeApi = (
  id: string,
  payload: {
    name: string;
    notes: string;
    ingredients: Array<{ name: string; supermarket: string }>;
  }
) => apiRequest<ApiRecipe>(`/api/recipes/${id}`, { method: 'PATCH', body: payload });

export const deleteRecipeApi = (id: string) =>
  apiRequest<{ ok: true }>(`/api/recipes/${id}`, { method: 'DELETE' });

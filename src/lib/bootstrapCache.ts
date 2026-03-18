import type { ApiBootstrap } from '@/lib/apiClient';

const CACHE_PREFIX = 'shopping-notes:bootstrap';
const CACHE_SCHEMA_VERSION = 1;

type CachedBootstrapSnapshot = {
  schemaVersion: number;
  cachedAt: number;
  payload: ApiBootstrap;
};

function getCacheKey(userId: string) {
  return `${CACHE_PREFIX}:${userId}`;
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readBootstrapCache(userId: string): CachedBootstrapSnapshot | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedBootstrapSnapshot>;
    if (
      parsed.schemaVersion !== CACHE_SCHEMA_VERSION ||
      typeof parsed.cachedAt !== 'number' ||
      !parsed.payload
    ) {
      return null;
    }

    return {
      schemaVersion: CACHE_SCHEMA_VERSION,
      cachedAt: parsed.cachedAt,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

export function writeBootstrapCache(userId: string, payload: ApiBootstrap, cachedAt = Date.now()) {
  if (!isBrowser()) return;

  const snapshot: CachedBootstrapSnapshot = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    cachedAt,
    payload,
  };

  try {
    window.localStorage.setItem(getCacheKey(userId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota/private mode failures. Network data remains source of truth.
  }
}

export function clearBootstrapCache(userId: string) {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(getCacheKey(userId));
  } catch {
    // Ignore local storage failures.
  }
}

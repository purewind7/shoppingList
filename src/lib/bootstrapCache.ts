import type { ApiBootstrap } from '@/lib/apiClient';

const CACHE_PREFIX = 'shopping-notes:bootstrap';
const CACHE_SCHEMA_VERSION = 1;

type CachedBootstrapSnapshot = {
  schemaVersion: number;
  cachedAt: number;
  etag: string | null;
  payload: ApiBootstrap;
};

export type BootstrapCacheSnapshot = CachedBootstrapSnapshot;

function getCacheKey(userId: string) {
  return `${CACHE_PREFIX}:${userId}`;
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readBootstrapCache(userId: string): BootstrapCacheSnapshot | null {
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
      etag: typeof parsed.etag === 'string' ? parsed.etag : null,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

export function writeBootstrapCache(
  userId: string,
  payload: ApiBootstrap,
  cachedAt = Date.now(),
  etag: string | null = null
) {
  if (!isBrowser()) return;

  const snapshot: CachedBootstrapSnapshot = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    cachedAt,
    etag,
    payload,
  };

  try {
    window.localStorage.setItem(getCacheKey(userId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota/private mode failures. Network data remains source of truth.
  }
}

export function touchBootstrapCache(userId: string, cachedAt = Date.now(), etag?: string | null) {
  const snapshot = readBootstrapCache(userId);
  if (!snapshot) return;

  writeBootstrapCache(userId, snapshot.payload, cachedAt, etag ?? snapshot.etag);
}

export function clearBootstrapCache(userId: string) {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(getCacheKey(userId));
  } catch {
    // Ignore local storage failures.
  }
}

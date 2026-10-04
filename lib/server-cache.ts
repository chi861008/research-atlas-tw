type CacheEntry = { body: string; expiresAt: number };

const globalCache = globalThis as typeof globalThis & {
  researchAtlasCache?: Map<string, CacheEntry>;
};

const cache = globalCache.researchAtlasCache ??= new Map<string, CacheEntry>();

export async function getCached(key: string): Promise<string | null> {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.body;
}

export async function putCached(key: string, body: string, ttlMs: number) {
  if (cache.size >= 500) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { body, expiresAt: Date.now() + ttlMs });
}

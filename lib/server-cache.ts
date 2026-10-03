import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { apiCache } from "../db/schema";

export async function getCached(key: string): Promise<string | null> {
  try {
    const [row] = await getDb().select().from(apiCache).where(eq(apiCache.key, key)).limit(1);
    return row && row.expiresAt > Date.now() ? row.body : null;
  } catch {
    return null;
  }
}

export async function putCached(key: string, body: string, ttlMs: number) {
  try {
    await getDb().insert(apiCache).values({ key, body, expiresAt: Date.now() + ttlMs })
      .onConflictDoUpdate({ target: apiCache.key, set: { body, expiresAt: Date.now() + ttlMs } });
  } catch {
    // Cache failures must not block research searches.
  }
}

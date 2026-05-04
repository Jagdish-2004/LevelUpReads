import redisClient from "./redis";
import { createContextLogger } from "./logger";

const log = createContextLogger("favouriteCache");

const CACHE_TTL = 600; // 10 minutes

const key = (userId: string) => `fav:${userId}`;

/**
 * Load all favourite bookIds for a user from Redis.
 * Returns null on cache miss or Redis failure.
 */
export async function getCachedIds(userId: string): Promise<string[] | null> {
  try {
    const raw = await redisClient.get(key(userId));
    if (!raw) return null;
    log.debug({ userId }, "Favourite cache HIT");
    return JSON.parse(raw) as string[];
  } catch (err) {
    log.error({ err, userId }, "Redis GET failed in favouriteCache");
    return null;
  }
}

/**
 * Overwrite the user's favourite list in Redis.
 * Resets the TTL to 10 minutes.
 */
export async function setCachedIds(userId: string, bookIds: string[]): Promise<void> {
  try {
    await redisClient.set(key(userId), JSON.stringify(bookIds), "EX", CACHE_TTL);
    log.debug({ userId, count: bookIds.length }, "Favourite cache SET");
  } catch (err) {
    log.error({ err, userId }, "Redis SET failed in favouriteCache");
  }
}

/**
 * Add a single bookId to the user's cached set.
 * Returns the updated list, or null if cache was empty (caller should seed from DB).
 */
export async function addToCache(userId: string, bookId: string): Promise<string[] | null> {
  try {
    const current = await getCachedIds(userId);
    if (current === null) return null; // Cache miss — let caller seed from DB first

    const updated = current.includes(bookId) ? current : [...current, bookId];
    await setCachedIds(userId, updated);
    return updated;
  } catch (err) {
    log.error({ err, userId, bookId }, "addToCache failed");
    return null;
  }
}

/**
 * Remove a single bookId from the user's cached set.
 * Returns the updated list, or null if cache was empty.
 */
export async function removeFromCache(userId: string, bookId: string): Promise<string[] | null> {
  try {
    const current = await getCachedIds(userId);
    if (current === null) return null;

    const updated = current.filter((id) => id !== bookId);
    await setCachedIds(userId, updated);
    return updated;
  } catch (err) {
    log.error({ err, userId, bookId }, "removeFromCache failed");
    return null;
  }
}

/**
 * Invalidate (delete) the user's favourites cache entry.
 */
export async function invalidateCache(userId: string): Promise<void> {
  try {
    await redisClient.del(key(userId));
    log.debug({ userId }, "Favourite cache INVALIDATED");
  } catch (err) {
    log.error({ err, userId }, "Redis DEL failed in favouriteCache");
  }
}

import { LRUCache } from "lru-cache";
import redisClient from "./redis";

// L1 Cache: In-Memory LRU
const lruOptions = {
  max: 500, // The maximum number of items that remain in the cache
  ttl: 1000 * 60 * 5, // 5 minutes
};

const l1Cache = new LRUCache<string, any>(lruOptions);

// L2 Cache operations
export const cacheManager = {
  async get<T>(key: string): Promise<T | null> {
    // 1. Try L1 Cache
    const l1Result = l1Cache.get(key);
    if (l1Result) {
      console.log(`[Cache Hit L1] ${key}`);
      return l1Result as T;
    }

    // 2. Try L2 Cache
    try {
      const l2Result = await redisClient.get(key);
      if (l2Result) {
        console.log(`[Cache Hit L2] ${key}`);
        const parsed = JSON.parse(l2Result) as T;
        // Populate L1
        l1Cache.set(key, parsed);
        return parsed;
      }
    } catch (err) {
      console.error("Redis Get Error:", err);
    }

    console.log(`[Cache Miss] ${key}`);
    return null;
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    // 1. Set L1
    l1Cache.set(key, value, { ttl: ttlSeconds * 1000 });

    // 2. Set L2
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      console.error("Redis Set Error:", err);
    }
  },

  async invalidate(key: string): Promise<void> {
    l1Cache.delete(key);
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error("Redis Del Error:", err);
    }
  },
};

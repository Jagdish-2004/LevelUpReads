import Redis from "ioredis";

/**
 * Lazily-initialised Redis singleton.
 *
 * The client is created on FIRST ACCESS (not at import time).
 * This prevents ioredis from opening a TCP connection or throwing
 * during the Next.js build phase when env vars are unavailable.
 */
let _client: Redis | null = null;

function getRedisClient(): Redis {
  if (_client) return _client;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const instance = new Redis(url, {
    maxRetriesPerRequest: null,   // required by BullMQ
    enableReadyCheck: false,       // don't block on ready
    lazyConnect: true,             // defer TCP connect until first command
  });

  instance.on("error", (err) => {
    // Log but never crash the process — Redis failures are non-fatal
    console.error("[redis] connection error:", err.message);
  });

  // Re-use across hot-reloads in dev
  if (process.env.NODE_ENV !== "production") {
    (global as any).__redisClient = instance;
  }

  _client = instance;
  return _client;
}

// In dev, re-use the global instance across HMR cycles
if (process.env.NODE_ENV !== "production" && (global as any).__redisClient) {
  _client = (global as any).__redisClient;
}

// Export a Proxy so every property access goes through getRedisClient()
// This means `import redisClient from "./redis"` is safe at module level —
// the actual connection is only opened when a method is first called.
const redisClient = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedisClient() as any)[prop];
  },
});

export default redisClient;

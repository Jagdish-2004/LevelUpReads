import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Create a singleton instance of Redis
let redisClient: Redis;

if (process.env.NODE_ENV === "production") {
  redisClient = new Redis(REDIS_URL);
} else {
  // In development, avoid creating multiple instances during hot reloading
  if (!(global as any).redisClient) {
    (global as any).redisClient = new Redis(REDIS_URL);
  }
  redisClient = (global as any).redisClient;
}

export default redisClient;

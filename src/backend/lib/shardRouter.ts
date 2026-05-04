import mongoose from "mongoose";
import { createContextLogger } from "./logger";
import { createCircuitBreaker } from "./circuitBreaker";

const log = createContextLogger("shardRouter");

/**
 * Application-Layer MongoDB Sharding
 * ─────────────────────────────────────────────────────────────────────────────
 * Instead of MongoDB Atlas Sharding (which requires a paid cluster), this
 * implements sharding at the application level:
 *
 *  userId → hash → shard index → MongoDB connection
 *
 * Each shard is a separate MongoDB database (can be on different hosts in prod).
 * User-specific data (reviews, progress, XP) is routed to the correct shard.
 *
 * To add more shards: add more URIs to SHARD_URIS in .env.local, e.g.:
 *   SHARD_URI_0=mongodb://host-a:27017/levelupreads_shard0
 *   SHARD_URI_1=mongodb://host-b:27017/levelupreads_shard1
 */

const SHARD_URIS: string[] = [
  process.env.SHARD_URI_0 || process.env.MONGODB_URI || "mongodb://localhost:27017/levelupreads_shard0",
  process.env.SHARD_URI_1 || process.env.MONGODB_URI || "mongodb://localhost:27017/levelupreads_shard1",
];

const TOTAL_SHARDS = SHARD_URIS.length;

// Cache of live mongoose instances per shard
const shardConnections: Map<number, mongoose.Mongoose> = new Map();
const shardPromises: Map<number, Promise<mongoose.Mongoose>> = new Map();

/**
 * Deterministic hash of a userId string → shard index.
 * Uses djb2 algorithm for even distribution.
 */
export function getShardIndex(userId: string): number {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  return Math.abs(hash) % TOTAL_SHARDS;
}

async function _openShardConnection(uri: string): Promise<mongoose.Mongoose> {
  const instance = new mongoose.Mongoose();
  await instance.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
  });
  return instance;
}

/**
 * Returns the Mongoose instance for the shard that owns this userId.
 * Connections are lazily opened and cached.
 */
export async function getShardConnection(userId: string): Promise<mongoose.Mongoose> {
  const shardIndex = getShardIndex(userId);
  const uri = SHARD_URIS[shardIndex];

  if (shardConnections.has(shardIndex)) {
    return shardConnections.get(shardIndex)!;
  }

  if (!shardPromises.has(shardIndex)) {
    const breaker = createCircuitBreaker(
      () => _openShardConnection(uri),
      { name: `mongodb-shard-${shardIndex}`, timeout: 8000, resetTimeout: 30_000 }
    );

    const promise = breaker
      .fire()
      .then((conn) => {
        log.info({ shardIndex, uri }, "Shard connection established");
        shardConnections.set(shardIndex, conn as mongoose.Mongoose);
        return conn as mongoose.Mongoose;
      })
      .catch((err) => {
        shardPromises.delete(shardIndex);
        log.error({ shardIndex, err }, "Failed to connect to shard");
        throw err;
      });

    shardPromises.set(shardIndex, promise);
  }

  return shardPromises.get(shardIndex)!;
}

/**
 * Get a Mongoose model scoped to the correct shard for a given userId.
 *
 * @example
 * const ReviewModel = await getShardedModel(userId, "Review", ReviewSchema);
 * await ReviewModel.create({ userId, bookId, content });
 */
export async function getShardedModel<T>(
  userId: string,
  modelName: string,
  schema: mongoose.Schema
): Promise<mongoose.Model<T>> {
  const conn = await getShardConnection(userId);

  // Return existing model if already registered on this connection
  if (conn.modelNames().includes(modelName)) {
    return conn.model<T>(modelName);
  }

  return conn.model<T>(modelName, schema);
}

/**
 * Debugging utility: shows which shard each userId maps to.
 */
export function explainShard(userId: string) {
  const idx = getShardIndex(userId);
  return { userId, shardIndex: idx, uri: SHARD_URIS[idx] };
}

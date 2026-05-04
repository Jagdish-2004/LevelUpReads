import mongoose from "mongoose";
import { createContextLogger } from "./logger";
import { createCircuitBreaker } from "./circuitBreaker";

const log = createContextLogger("db");

const PRIMARY_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/levelupreads";
const REPLICA_URI = process.env.MONGODB_REPLICA_URI || PRIMARY_URI; // Falls back to primary if no replica configured

if (!PRIMARY_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// ── Primary connection (for writes) ─────────────────────────────────────────
let primaryCache = (global as any).__mongoosePrimary as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!primaryCache) {
  primaryCache = (global as any).__mongoosePrimary = { conn: null, promise: null };
}

async function _connectPrimary() {
  return mongoose.connect(PRIMARY_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
  });
}

// Wrap the connection attempt in a circuit breaker
const primaryCircuitBreaker = createCircuitBreaker(_connectPrimary, {
  name: "mongodb-primary",
  timeout: 8000,
  errorThresholdPercentage: 50,
  resetTimeout: 60_000,
});

async function connectToDatabase(): Promise<typeof mongoose> {
  if (primaryCache.conn) return primaryCache.conn;

  if (!primaryCache.promise) {
    primaryCache.promise = primaryCircuitBreaker
      .fire()
      .then((conn) => {
        log.info("Connected to MongoDB primary");
        return conn as typeof mongoose;
      })
      .catch((err) => {
        primaryCache.promise = null;
        log.error({ err }, "Failed to connect to MongoDB primary");
        throw err;
      });
  }

  primaryCache.conn = await primaryCache.promise;
  return primaryCache.conn!;
}

// ── Read Replica connection (for reads: trending, explore) ───────────────────
let replicaCache = (global as any).__mongooseReplica as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!replicaCache) {
  replicaCache = (global as any).__mongooseReplica = { conn: null, promise: null };
}

async function _connectReplica() {
  // Use a separate mongoose instance to avoid overriding the global state
  const replicaMongoose = new mongoose.Mongoose();
  await replicaMongoose.connect(REPLICA_URI, {
    bufferCommands: false,
    maxPoolSize: 20,          // Higher pool — replicas handle high read traffic
    readPreference: "secondaryPreferred" as any,
  });
  return replicaMongoose;
}

const replicaCircuitBreaker = createCircuitBreaker(_connectReplica, {
  name: "mongodb-replica",
  timeout: 8000,
  errorThresholdPercentage: 60,
  resetTimeout: 30_000,
});

/**
 * Returns a read-optimised Mongoose instance pointing at the replica.
 * Falls back to the primary if the replica circuit is open or unavailable.
 */
export async function connectReadReplica(): Promise<mongoose.Mongoose> {
  if (replicaCache.conn) return replicaCache.conn as unknown as mongoose.Mongoose;

  if (!replicaCache.promise) {
    replicaCache.promise = replicaCircuitBreaker
      .fire()
      .then((conn) => {
        log.info({ uri: REPLICA_URI }, "Connected to MongoDB read replica");
        return conn as unknown as typeof mongoose;
      })
      .catch(async (err) => {
        replicaCache.promise = null;
        log.warn({ err }, "Replica unavailable — falling back to primary for reads");
        return connectToDatabase(); // graceful degradation
      });
  }

  replicaCache.conn = await replicaCache.promise;
  return replicaCache.conn as unknown as mongoose.Mongoose;
}

export default connectToDatabase;

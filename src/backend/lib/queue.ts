import { Queue, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";
import { createContextLogger } from "../lib/logger";

const log = createContextLogger("queue");

/**
 * All Queue/Worker objects are lazily initialised behind getter functions.
 * This prevents BullMQ from opening Redis connections during the
 * Next.js build phase.
 */

// ── Shared Redis connection (lazy) ────────────────────────────────────────────
let _connection: IORedis | null = null;

function getConnection(): IORedis {
  if (_connection) return _connection;
  _connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  _connection.on("connect", () => log.info("BullMQ Redis connection established"));
  _connection.on("error", (err) => log.error({ err }, "BullMQ Redis error"));
  return _connection;
}

// ── Default job options ───────────────────────────────────────────────────────
const defaultJobOptions = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
};

// ── Lazy Queue singletons ─────────────────────────────────────────────────────
let _bookQueue: Queue | null = null;
let _reviewQueue: Queue | null = null;
let _rewardQueue: Queue | null = null;
let _favouriteSyncQueue: Queue | null = null;

export function getBookQueue(): Queue {
  if (!_bookQueue) _bookQueue = new Queue("book-ingestion", { connection: getConnection(), defaultJobOptions });
  return _bookQueue;
}

export function getReviewQueue(): Queue {
  if (!_reviewQueue) _reviewQueue = new Queue("review-processing", { connection: getConnection(), defaultJobOptions });
  return _reviewQueue;
}

export function getRewardQueue(): Queue {
  if (!_rewardQueue) _rewardQueue = new Queue("reward-fanout", { connection: getConnection(), defaultJobOptions });
  return _rewardQueue;
}

export function getFavouriteSyncQueue(): Queue {
  if (!_favouriteSyncQueue) {
    _favouriteSyncQueue = new Queue("favourite-sync", {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 1000 },
      },
    });
  }
  return _favouriteSyncQueue;
}

// ── Keep backward-compatible named exports ────────────────────────────────────
export const bookQueue = new Proxy({} as Queue, { get: (_, p) => (getBookQueue() as any)[p] });
export const reviewQueue = new Proxy({} as Queue, { get: (_, p) => (getReviewQueue() as any)[p] });
export const rewardQueue = new Proxy({} as Queue, { get: (_, p) => (getRewardQueue() as any)[p] });
export const favouriteSyncQueue = new Proxy({} as Queue, { get: (_, p) => (getFavouriteSyncQueue() as any)[p] });

// redisConnection export for workers
export function redisConnection(): IORedis {
  return getConnection();
}

/**
 * Add a deduplicated reward job.
 */
export async function addRewardJob(userId: string, data: Record<string, unknown>) {
  const jobId = `reward:${userId}`;
  const queue = getRewardQueue();
  const existing = await queue.getJob(jobId);

  if (existing && (await existing.isActive())) {
    log.warn({ jobId }, "Reward job already active — skipping duplicate");
    return null;
  }

  return queue.add("process-reward", data, { jobId, ...defaultJobOptions });
}

/**
 * Queue a write-back DB sync for a user's favourites.
 * Deduplicated per userId with a 3s write-behind delay.
 */
export async function addFavouriteSyncJob(userId: string, bookIds: string[]): Promise<void> {
  const jobId = `fsync:${userId}`;
  const queue = getFavouriteSyncQueue();

  try {
    const existing = await queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === "delayed" || state === "waiting") await existing.remove();
    }
    await queue.add("sync-favourites", { userId, bookIds }, { jobId, delay: 3000 });
    log.debug({ jobId, count: bookIds.length }, "Favourite sync job queued");
  } catch (err) {
    log.error({ err, userId }, "Failed to queue favourite sync job");
  }
}

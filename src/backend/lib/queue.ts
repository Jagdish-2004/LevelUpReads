import { Queue, Worker, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";
import { createContextLogger } from "../lib/logger";

const log = createContextLogger("queue");

// ── Shared Redis connection ───────────────────────────────────────────────────
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("connect", () => log.info("BullMQ Redis connection established"));
connection.on("error", (err) => log.error({ err }, "BullMQ Redis error"));

// ── Default job options ──────────────────────────────────────────────────────
const defaultJobOptions = {
  removeOnComplete: { count: 100 },   // Keep last 100 completed jobs for debugging
  removeOnFail: { count: 200 },
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
};

// ── Queues ───────────────────────────────────────────────────────────────────
export const bookQueue = new Queue("book-ingestion", {
  connection,
  defaultJobOptions,
});

export const reviewQueue = new Queue("review-processing", {
  connection,
  defaultJobOptions,
});

export const rewardQueue = new Queue("reward-fanout", {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    /**
     * Deduplication for high-fanout reward events.
     * BullMQ's `jobId` acts as a natural deduplication key —
     * if a job with the same jobId already exists in the queue,
     * the new add() call is silently ignored.
     *
     * Use: addRewardJob("user_abc", { xp: 20 }) → jobId = "reward:user_abc"
     * A second call with the same userId won't create a duplicate.
     */
  },
});

// ── Queue events ─────────────────────────────────────────────────────────────
export const bookQueueEvents = new QueueEvents("book-ingestion", { connection });
export const reviewQueueEvents = new QueueEvents("review-processing", { connection });
export const rewardQueueEvents = new QueueEvents("reward-fanout", { connection });

bookQueueEvents.on("completed", ({ jobId }) =>
  log.info({ jobId }, "book-ingestion job completed")
);
bookQueueEvents.on("failed", ({ jobId, failedReason }) =>
  log.error({ jobId, failedReason }, "book-ingestion job FAILED")
);

rewardQueueEvents.on("failed", ({ jobId, failedReason }) =>
  log.error({ jobId, failedReason }, "reward-fanout job FAILED")
);

/**
 * Add a deduplicated reward job.
 * Using the userId as the jobId ensures that if a global reward update
 * is triggered multiple times (high fan-out), only one job runs per user.
 *
 * @param userId The user receiving the reward
 * @param data   The job payload
 */
export async function addRewardJob(userId: string, data: Record<string, unknown>) {
  const jobId = `reward:${userId}`;
  const existing = await rewardQueue.getJob(jobId);

  if (existing && (await existing.isActive())) {
    log.warn({ jobId }, "Reward job already active — skipping duplicate");
    return null;
  }

  return rewardQueue.add("process-reward", data, {
    jobId,           // deterministic ID = deduplication key
    ...defaultJobOptions,
  });
}

export { connection as redisConnection };

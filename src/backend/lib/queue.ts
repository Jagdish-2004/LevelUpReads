import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// Reuse standard redis connection string, but BullMQ requires ioredis instance
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const bookQueue = new Queue("book-ingestion", { connection });
export const reviewQueue = new Queue("review-processing", { connection });

export const bookQueueEvents = new QueueEvents("book-ingestion", { connection });
export const reviewQueueEvents = new QueueEvents("review-processing", { connection });

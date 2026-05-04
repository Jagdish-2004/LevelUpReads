import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/queue";
import connectToDatabase from "../lib/db";
import { Favourite } from "../models/Favourite";
import { createContextLogger } from "../lib/logger";

const log = createContextLogger("favouriteWorker");

interface SyncPayload {
  userId: string;
  bookIds: string[];
}

/**
 * Write-back worker: reads the bookIds snapshot written to Redis
 * by the API and persists them to MongoDB.
 *
 * A 3-second delay + deterministic jobId ensures that rapid
 * add/remove clicks are collapsed into a single DB write.
 */
const favouriteWorker = new Worker<SyncPayload>(
  "favourite-sync",
  async (job: Job<SyncPayload>) => {
    const { userId, bookIds } = job.data;
    const reqLog = log.child({ jobId: job.id, userId, count: bookIds.length });

    reqLog.info("Starting favourite DB sync");

    await connectToDatabase();

    await Favourite.findOneAndUpdate(
      { userId },
      {
        $set: {
          bookIds: [...new Set(bookIds)], // deduplicate just in case
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    reqLog.info("Favourite DB sync complete");
  },
  {
    connection: redisConnection(),
    concurrency: 10,
  }
);

favouriteWorker.on("completed", (job) =>
  log.info({ jobId: job.id }, "Favourite sync job completed")
);

favouriteWorker.on("failed", (job, err) =>
  log.error({ jobId: job?.id, err }, "Favourite sync job FAILED")
);

export default favouriteWorker;

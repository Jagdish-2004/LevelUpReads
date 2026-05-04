import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import connectToDatabase from "../lib/db";
import { Book } from "../models/Book";
import { cacheManager } from "../lib/cache";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const reviewWorker = new Worker(
  "review-processing",
  async (job: Job) => {
    await connectToDatabase();
    
    const { userId, userName, bookId, rating, comment, createdAt } = job.data;
    console.log(`Processing review job ${job.id} for book ${bookId}`);

    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    // Embed review inside book (top 5)
    book.recentReviews.unshift({
      userId,
      userName,
      rating,
      comment,
      createdAt,
    });

    if (book.recentReviews.length > 5) {
      book.recentReviews.pop();
    }

    // Update average rating
    const totalRating = (book.averageRating * book.ratingsCount) + rating;
    book.ratingsCount += 1;
    book.averageRating = totalRating / book.ratingsCount;

    await book.save();

    // Invalidate cache
    await cacheManager.invalidate(`book:${bookId}`);

    return { success: true };
  },
  { connection }
);

reviewWorker.on("completed", (job) => {
  console.log(`Review Job ${job.id} completed successfully`);
});

reviewWorker.on("failed", (job, err) => {
  console.error(`Review Job ${job?.id} failed with error: ${err.message}`);
});

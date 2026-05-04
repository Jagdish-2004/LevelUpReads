import connectToDatabase from "../lib/db";
import { Review } from "../models/Review";
import { reviewQueue } from "../lib/queue";

export class ReviewService {
  static async addReview(userId: string, userName: string, bookId: string, rating: number, comment: string) {
    await connectToDatabase();

    const review = await Review.create({
      userId,
      bookId,
      rating,
      comment,
    });

    // Enqueue job to update book's recent reviews and average rating
    await reviewQueue.add("process-review", {
      reviewId: review._id.toString(),
      userId,
      userName,
      bookId,
      rating,
      comment,
      createdAt: review.createdAt,
    });

    return review;
  }
}

import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  userId: string; // User ID from our User model
  bookId: string; // Book ID from our Book model
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Optimize queries for a book's reviews
ReviewSchema.index({ bookId: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

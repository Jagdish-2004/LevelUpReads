import mongoose, { Schema, Document } from "mongoose";

export interface IReviewEmbed {
  userId: string; // We can use string or ObjectId
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IBook extends Document {
  title: string;
  authors: string[];
  description?: string;
  genres: string[];
  averageRating: number;
  ratingsCount: number;
  coverImage?: string;
  source: string; // e.g. "google", "openlibrary", "custom"
  sourceId: string; // e.g. Google Books ID
  xpValue: number;
  recentReviews: IReviewEmbed[]; // Embedded recent reviews for fast access
  createdAt: Date;
  updatedAt: Date;
}

const ReviewEmbedSchema = new Schema<IReviewEmbed>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const BookSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    authors: [{ type: String }],
    description: { type: String },
    genres: [{ type: String }],
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    coverImage: { type: String },
    source: { type: String, required: true },
    sourceId: { type: String, required: true, unique: true },
    xpValue: { type: Number, default: 10 },
    recentReviews: [ReviewEmbedSchema],
  },
  { timestamps: true }
);

// Full-text search index
BookSchema.index(
  { title: "text", authors: "text", description: "text" },
  { weights: { title: 10, authors: 5, description: 1 } }
);

// Composite index for trending query: sort by rating + ratingsCount
// Covers: Book.find({}).sort({ averageRating: -1, ratingsCount: -1 })
BookSchema.index({ averageRating: -1, ratingsCount: -1 });

// Composite index for genre filtering + rating sort
// Covers: Book.find({ genres: genre }).sort({ averageRating: -1 })
BookSchema.index({ genres: 1, averageRating: -1 });

// Index for source lookups (used during upsert from Open Library)
BookSchema.index({ source: 1, sourceId: 1 });

export const Book = mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

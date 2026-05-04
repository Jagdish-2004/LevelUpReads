import mongoose, { Schema, Document } from "mongoose";

/**
 * Dedicated Favourite collection.
 * One document per user — stores bookIds (sourceIds) as a flat array.
 * Unique index on userId ensures no duplicates per user.
 */
export interface IFavourite extends Document {
  userId: string;   // user email (stable unique key)
  bookIds: string[];
  updatedAt: Date;
  createdAt: Date;
}

const FavouriteSchema = new Schema<IFavourite>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Ensures O(1) lookup by userId
FavouriteSchema.index({ userId: 1 }, { unique: true });

export const Favourite =
  mongoose.models.Favourite ||
  mongoose.model<IFavourite>("Favourite", FavouriteSchema);

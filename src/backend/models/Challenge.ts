import mongoose, { Schema, Document } from "mongoose";

export interface IChallenge extends Document {
  title: string;
  description?: string;
  goal: number; // e.g. Number of books to read
  rewardXp: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    goal: { type: Number, required: true },
    rewardXp: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Challenge = mongoose.models.Challenge || mongoose.model<IChallenge>("Challenge", ChallengeSchema);

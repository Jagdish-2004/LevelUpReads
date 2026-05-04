import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: "admin" | "reader";
  xp: number;
  booksRead: number;
  readBookIds: string[];
  phone?: string;
  dob?: string;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "reader"],
      default: "reader",
    },
    xp: { type: Number, default: 0 },
    booksRead: { type: Number, default: 0 },
    readBookIds: [{ type: String }],
    phone: { type: String },
    dob: { type: String },
    phoneVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

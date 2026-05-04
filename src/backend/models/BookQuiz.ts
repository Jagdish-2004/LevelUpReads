import mongoose, { Schema, Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface IBookQuiz extends Document {
  bookId: string;
  bookTitle: string;
  questions: IQuizQuestion[];
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  },
  { _id: false }
);

const BookQuizSchema = new Schema<IBookQuiz>(
  {
    bookId: { type: String, required: true, unique: true },
    bookTitle: { type: String, required: true },
    questions: [QuizQuestionSchema],
  },
  { timestamps: true }
);

export const BookQuiz =
  mongoose.models.BookQuiz ||
  mongoose.model<IBookQuiz>("BookQuiz", BookQuizSchema);

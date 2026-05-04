import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

const PASS_THRESHOLD = 0.7; // 70% correct to pass

export async function POST(req: NextRequest) {
  // Authenticate the user
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId, answers, questions, xpValue = 20 } = await req.json();

  if (!bookId || !answers || !questions) {
    return NextResponse.json({ error: "Missing bookId, answers, or questions" }, { status: 400 });
  }

  // Calculate score
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] !== undefined && answers[i] === questions[i].correctIndex) {
      correct++;
    }
  }

  const score = correct / questions.length;
  const passed = score >= PASS_THRESHOLD;

  await connectToDatabase();

  // Check if user already earned XP for this book
  const user = await User.findOne({ email: session.user.email });
  const alreadyRead = user?.readBookIds?.includes(bookId);

  let xpGained = 0;

  if (passed && !alreadyRead) {
    // Award XP and mark book as read
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $inc: { xp: xpValue, booksRead: 1 },
        $addToSet: { readBookIds: bookId },
      }
    );
    xpGained = xpValue;
  }

  return NextResponse.json({
    passed,
    score: Math.round(score * 100),
    correct,
    total: questions.length,
    xpGained,
    alreadyRead: alreadyRead || false,
  });
}

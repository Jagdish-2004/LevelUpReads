import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/backend/lib/db";
import { BookQuiz } from "@/backend/models/BookQuiz";

const QUIZ_POOL_THRESHOLD = 30;
const QUESTIONS_PER_QUIZ = 5;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const bookTitle = decodeURIComponent(searchParams.get("bookTitle") || "this book");
  const description = decodeURIComponent(searchParams.get("description") || "");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured in .env.local" }, { status: 500 });
  }

  try {
    await connectToDatabase();
    let bookQuiz = await BookQuiz.findOne({ bookId });

    // If pool is full, return random questions without calling LLM
    if (bookQuiz && bookQuiz.questions.length >= QUIZ_POOL_THRESHOLD) {
      const shuffled = [...bookQuiz.questions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, QUESTIONS_PER_QUIZ),
        source: "cache",
        poolSize: bookQuiz.questions.length,
      });
    }

    // Call Gemini LLM
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const existingQuestions = bookQuiz?.questions.map((q: any) => q.question).join("\n- ") || "";

    const prompt = `You are a reading comprehension quiz generator.
Generate exactly ${QUESTIONS_PER_QUIZ} multiple-choice questions about the book "${bookTitle}".
${description ? `Book description: "${description.slice(0, 500)}"` : ""}
${existingQuestions ? `Do NOT repeat these questions:\n- ${existingQuestions}` : ""}

Return ONLY a valid JSON array. No markdown, no code fences, no explanation. Example format:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]

Rules:
- correctIndex is 0, 1, 2, or 3
- Exactly 4 options per question
- Questions about themes, plot, characters, or author intent`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Robustly extract JSON from response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[quiz/generate] Raw LLM response:", rawText);
      throw new Error("LLM did not return a valid JSON array. Raw: " + rawText.slice(0, 200));
    }

    const newQuestions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
      throw new Error("Parsed questions array is empty");
    }

    // Persist to DB
    if (!bookQuiz) {
      bookQuiz = await BookQuiz.create({ bookId, bookTitle, questions: newQuestions });
    } else {
      bookQuiz.questions.push(...newQuestions);
      await bookQuiz.save();
    }

    return NextResponse.json({
      questions: newQuestions.slice(0, QUESTIONS_PER_QUIZ),
      source: "llm",
      poolSize: bookQuiz.questions.length,
    });
  } catch (err: any) {
    console.error("[quiz/generate] ERROR:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}


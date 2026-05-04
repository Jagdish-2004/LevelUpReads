import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/backend/lib/db";
import { BookQuiz } from "@/backend/models/BookQuiz";
import { createContextLogger } from "@/backend/lib/logger";

const log = createContextLogger("quiz:generate");

const QUIZ_POOL_THRESHOLD = 30;
const QUESTIONS_PER_QUIZ = 5;

/** Static fallback — shown when the LLM is unavailable */
const STATIC_FALLBACK_QUESTIONS = [
  {
    question: "What is the central theme of most great literature?",
    options: ["The human condition", "Space exploration", "Cooking recipes", "Sports"],
    correctIndex: 0,
    explanation: "Great literature explores the human condition — emotions, morality, and society.",
  },
  {
    question: "Which narrative element drives most stories forward?",
    options: ["Setting", "Conflict", "Font choice", "Page count"],
    correctIndex: 1,
    explanation: "Conflict is the engine of storytelling — it creates tension and propels the plot.",
  },
  {
    question: "What does 'character development' mean?",
    options: [
      "Designing a character's appearance",
      "A character growing or changing through the story",
      "Listing a character's hobbies",
      "Naming a character",
    ],
    correctIndex: 1,
    explanation: "Character development refers to how a character evolves due to story events.",
  },
  {
    question: "What is a 'plot twist'?",
    options: [
      "A physical turn in the road",
      "A sudden unexpected change in the story",
      "A type of dialogue",
      "A chapter break",
    ],
    correctIndex: 1,
    explanation: "A plot twist is an unexpected development that changes the story's direction.",
  },
  {
    question: "What is the role of a narrator in a story?",
    options: [
      "To draw illustrations",
      "To tell the story from a chosen point of view",
      "To write the index",
      "To choose the book title",
    ],
    correctIndex: 1,
    explanation: "The narrator controls how the story is told and what information the reader receives.",
  },
];

/** Models to try in order — falls back if quota/version error */
const MODEL_CHAIN = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

/** 
 * Transform the new prompt's response format → internal model format.
 *
 * New format:  { options: {A,B,C,D}, correctAnswer: "B", difficulty: "..." }
 * Model format: { options: string[], correctIndex: number, difficulty: "..." }
 */
function normaliseQuestions(raw: any[]): any[] {
  const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  return raw.map((q: any) => {
    // Support both formats in case the LLM mixes them
    let options: string[];
    let correctIndex: number;

    if (Array.isArray(q.options)) {
      // Already in array format
      options = q.options;
      correctIndex =
        typeof q.correctIndex === "number"
          ? q.correctIndex
          : letterToIndex[String(q.correctAnswer ?? "A").toUpperCase()] ?? 0;
    } else if (q.options && typeof q.options === "object") {
      // New {A,B,C,D} object format
      options = [
        q.options.A ?? "",
        q.options.B ?? "",
        q.options.C ?? "",
        q.options.D ?? "",
      ];
      correctIndex = letterToIndex[String(q.correctAnswer ?? "A").toUpperCase()] ?? 0;
    } else {
      options = ["Option A", "Option B", "Option C", "Option D"];
      correctIndex = 0;
    }

    return {
      question: String(q.question ?? ""),
      options,
      correctIndex,
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty ?? "medium",
    };
  });
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  for (const modelName of MODEL_CHAIN) {
    try {
      log.info({ modelName }, "Trying Gemini model");
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      log.info({ modelName, chars: text.length }, "Gemini response received");
      return text;
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      log.warn({ modelName, error: msg }, "Model failed, trying next");
      if (msg.includes("API_KEY_INVALID") || msg.includes("401")) {
        throw new Error(`API key is invalid: ${msg}`);
      }
    }
  }
  throw new Error("All Gemini model variants exhausted");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const bookTitle = decodeURIComponent(searchParams.get("bookTitle") || "this book");
  const description = decodeURIComponent(searchParams.get("description") || "");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const rawKey = process.env.GEMINI_API_KEY ?? "";
  const apiKey = rawKey.trim();

  log.info({
    keyPresent: !!apiKey,
    keyLength: apiKey.length,
    keyPrefix: apiKey.slice(0, 8) + "...",
  }, "API key debug");

  await connectToDatabase();

  // ── Cache check ───────────────────────────────────────────────────────────
  let bookQuiz = await BookQuiz.findOne({ bookId });

  if (bookQuiz && bookQuiz.questions.length >= QUIZ_POOL_THRESHOLD) {
    log.info({ bookId, poolSize: bookQuiz.questions.length }, "Serving from question pool");
    const shuffled = [...bookQuiz.questions].sort(() => Math.random() - 0.5);
    return NextResponse.json({
      questions: shuffled.slice(0, QUESTIONS_PER_QUIZ),
      source: "cache",
      poolSize: bookQuiz.questions.length,
    });
  }

  if (!apiKey || apiKey.length < 20) {
    log.warn({ bookId }, "No valid GEMINI_API_KEY — returning static fallback");
    return NextResponse.json({
      questions: STATIC_FALLBACK_QUESTIONS,
      source: "static_fallback",
      warning: "Set GEMINI_API_KEY in .env.local for AI-powered quizzes.",
    });
  }

  // ── Build expert educator prompt ──────────────────────────────────────────
  const existingQs = bookQuiz?.questions.map((q: any) => q.question).join("\n- ") || "";
  const summary = description.slice(0, 800) || `The book "${bookTitle}" and its key themes.`;

  const prompt = `You are an expert educator and question-setter.

Your task is to generate **high-quality multiple-choice questions (MCQs)** based on the given book summary.

---

## 🎯 Instructions

* Generate **exactly ${QUESTIONS_PER_QUIZ} MCQs**
* Each question must:
  * Be clear and unambiguous
  * Test understanding (not just copy-paste facts)
  * Be based strictly on the summary

---

## 📌 Question Format

For each MCQ provide:
1. Question
2. 4 options (A, B, C, D)
3. Correct answer
4. Short explanation (1–2 lines)

---

## 🧠 Difficulty Level

* Mix of:
  * 2 Easy (direct understanding)
  * 2 Medium (concept-based)
  * 1 Hard (inference / deeper meaning)

---

## 🚫 Avoid

* Trivial or obvious questions
* Repeating the same concept
* Questions not supported by the summary
* Ambiguous answers
${existingQs ? `* Do NOT repeat these already-used questions:\n  - ${existingQs}` : ""}

---

## 📚 Book

Title: "${bookTitle}"

Summary:
"""
${summary}
"""

---

## 📦 Output Format (STRICT JSON — no markdown, no code fences, no extra text)

{"questions":[{"question":"string","options":{"A":"string","B":"string","C":"string","D":"string"},"correctAnswer":"A","explanation":"string","difficulty":"easy"}]}

## 🎯 Quality Requirements

* Questions must reflect real comprehension of the book
* Include at least one application or inference-based question
* Ensure only one correct answer per question
* Distractors (wrong options) should be plausible but clearly incorrect`;

  // ── Call Gemini ───────────────────────────────────────────────────────────
  try {
    const rawText = await callGemini(apiKey, prompt);

    // Extract JSON — strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/) ?? cleaned.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      log.error({ rawText: rawText.slice(0, 300) }, "LLM did not return JSON");
      throw new Error("LLM response was not valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Support both { questions: [...] } and bare [...] responses
    const rawQuestions: any[] = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);

    if (rawQuestions.length === 0) throw new Error("Parsed question array is empty");

    // Normalise to internal model format
    const newQuestions = normaliseQuestions(rawQuestions);

    // Persist to MongoDB
    if (!bookQuiz) {
      bookQuiz = await BookQuiz.create({ bookId, bookTitle, questions: newQuestions });
    } else {
      bookQuiz.questions.push(...newQuestions);
      await bookQuiz.save();
    }

    log.info({ bookId, newCount: newQuestions.length, poolSize: bookQuiz.questions.length }, "Quiz persisted");

    return NextResponse.json({
      questions: newQuestions.slice(0, QUESTIONS_PER_QUIZ),
      source: "llm",
      poolSize: bookQuiz.questions.length,
    });
  } catch (err: any) {
    const msg = err?.message ?? "Unknown error";
    log.error({ bookId, error: msg }, "Gemini call failed — using fallback");

    if (bookQuiz && bookQuiz.questions.length > 0) {
      const shuffled = [...bookQuiz.questions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, QUESTIONS_PER_QUIZ),
        source: "partial_cache_fallback",
        poolSize: bookQuiz.questions.length,
        warning: "AI unavailable — showing cached questions.",
      });
    }

    return NextResponse.json({
      questions: STATIC_FALLBACK_QUESTIONS,
      source: "static_fallback",
      warning: "AI quiz generation failed. Showing generic questions.",
      debugError: process.env.NODE_ENV === "development" ? msg : undefined,
    });
  }
}

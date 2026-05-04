"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizResult {
  passed: boolean;
  score: number;
  correct: number;
  total: number;
  xpGained: number;
  alreadyRead?: boolean;
}

interface QuizModalProps {
  bookId: string;
  bookTitle: string;
  description?: string;
  xpValue?: number;
  onClose: () => void;
}

type Stage = "loading" | "quiz" | "result" | "error";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizModal({
  bookId,
  bookTitle,
  description = "",
  xpValue = 20,
  onClose,
}: QuizModalProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [source, setSource] = useState<"llm" | "cache">("llm");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(
          `/api/quiz/generate?bookId=${encodeURIComponent(bookId)}&bookTitle=${encodeURIComponent(bookTitle)}&description=${encodeURIComponent(description)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load quiz");
        setQuestions(data.questions);
        setSource(data.source);
        setStage("quiz");
      } catch (err: any) {
        setErrorMsg(err.message);
        setStage("error");
      }
    };
    fetchQuiz();
  }, [bookId, bookTitle, description]);

  const handleOptionSelect = (idx: number) => {
    if (selected !== null) return; // Already selected
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];

    if (currentQ + 1 < questions.length) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      // Submit quiz
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          answers: finalAnswers,
          questions,
          xpValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStage("result");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = ((currentQ + (selected !== null ? 1 : 0)) / questions.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Reading Quiz</p>
            <h2 className="text-lg font-bold truncate max-w-xs">{bookTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* LOADING */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">Generating your quiz with AI...</p>
              <p className="text-xs text-gray-400">This may take a few seconds</p>
            </div>
          )}

          {/* ERROR */}
          {stage === "error" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <span className="text-5xl">⚠️</span>
              <h3 className="text-xl font-bold text-red-600">Quiz Unavailable</h3>
              <p className="text-gray-500 text-sm max-w-xs">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-black text-white rounded-full hover:opacity-80 transition"
              >
                Close
              </button>
            </div>
          )}

          {/* QUIZ */}
          {stage === "quiz" && questions.length > 0 && (
            <div>
              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                  {currentQ + 1} / {questions.length}
                </span>
              </div>

              {/* Source badge */}
              {source === "cache" && (
                <p className="text-xs text-gray-400 mb-3">✨ Questions from our question bank</p>
              )}

              {/* Question */}
              <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-6">
                {questions[currentQ].question}
              </h3>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {questions[currentQ].options.map((option, idx) => {
                  let btnClass =
                    "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 flex items-center gap-3 ";

                  if (selected === null) {
                    btnClass += "border-gray-200 hover:border-black hover:bg-gray-50 cursor-pointer";
                  } else if (idx === questions[currentQ].correctIndex) {
                    btnClass += "border-green-500 bg-green-50 text-green-800";
                  } else if (idx === selected) {
                    btnClass += "border-red-400 bg-red-50 text-red-700";
                  } else {
                    btnClass += "border-gray-100 bg-gray-50 text-gray-400 cursor-default";
                  }

                  return (
                    <button key={idx} className={btnClass} onClick={() => handleOptionSelect(idx)}>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selected === null
                            ? "bg-gray-100 text-gray-600"
                            : idx === questions[currentQ].correctIndex
                            ? "bg-green-500 text-white"
                            : idx === selected
                            ? "bg-red-400 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {OPTION_LABELS[idx]}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after answer */}
              {selected !== null && questions[currentQ].explanation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  💡 {questions[currentQ].explanation}
                </div>
              )}

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={selected === null || submitting}
                className="mt-6 w-full py-3 bg-black text-white rounded-full font-semibold hover:opacity-80 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Submitting..."
                  : currentQ + 1 === questions.length
                  ? "Submit Quiz →"
                  : "Next Question →"}
              </button>
            </div>
          )}

          {/* RESULT */}
          {stage === "result" && result && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <span className="text-6xl">
                {result.passed ? "🎉" : "😢"}
              </span>

              <h3 className={`text-2xl font-bold ${result.passed ? "text-green-600" : "text-red-500"}`}>
                {result.passed ? "You Passed!" : "Not Quite!"}
              </h3>

              <p className="text-gray-500 text-sm">
                You got <span className="font-bold text-black">{result.correct}</span> out of{" "}
                <span className="font-bold text-black">{result.total}</span> correct — {result.score}%
              </p>

              {/* Score ring */}
              <div
                className={`w-28 h-28 rounded-full border-8 flex items-center justify-center text-3xl font-black ${
                  result.passed ? "border-green-400 text-green-600" : "border-red-300 text-red-500"
                }`}
              >
                {result.score}%
              </div>

              {result.passed && result.xpGained > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-3">
                  <p className="text-yellow-700 font-bold text-lg">+{result.xpGained} XP Earned! ⭐</p>
                  <p className="text-yellow-600 text-xs mt-1">Check your dashboard for updated rank</p>
                </div>
              )}

              {result.passed && result.alreadyRead && (
                <p className="text-gray-400 text-sm">You already earned XP for this book before.</p>
              )}

              {!result.passed && (
                <p className="text-gray-500 text-sm">
                  You need 70% to pass. Give it another read and try again!
                </p>
              )}

              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 bg-black text-white rounded-full font-semibold hover:opacity-80 transition"
              >
                {result.passed ? "Back to Explore 🚀" : "Try Again Later"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QuizModal from "./QuizModal";

interface BookProps {
  id: string;
  title: string;
  authors: string[];
  genres: string[];
  coverImage: string | null;
  averageRating?: number;
  description?: string;
  xpValue?: number;
}

export default function BookCard({
  id,
  title,
  authors,
  genres,
  coverImage,
  averageRating,
  description = "",
  xpValue = 20,
}: BookProps) {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <>
      <div className="border rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-lg transition bg-white h-full">
        <div className="relative w-full h-[220px] mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              unoptimized
            />
          ) : (
            <span className="text-gray-400 text-4xl">📚</span>
          )}
        </div>

        <h3 className="mt-2 font-medium text-lg text-center line-clamp-2 w-full">
          {title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-1 w-full text-center">
          {authors && authors.length > 0 ? authors.join(", ") : "Unknown Author"}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {averageRating ? (
            <span className="text-yellow-500 text-sm font-semibold">★ {averageRating.toFixed(1)}</span>
          ) : null}
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {genres && genres.length > 0 ? genres[0] : "General"}
          </span>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-2 w-full">
          <button
            onClick={() => router.push(`/books/${id}`)}
            className="w-full px-6 py-2 bg-black text-white rounded-full text-sm hover:opacity-80 transition"
          >
            Read More →
          </button>
          <button
            onClick={() => setShowQuiz(true)}
            className="w-full px-6 py-2 border-2 border-black text-black rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            ✅ I've Read This
          </button>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          bookId={id}
          bookTitle={title}
          description={description}
          xpValue={xpValue}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </>
  );
}

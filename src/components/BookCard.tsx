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
  isFavourited?: boolean;
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
  isFavourited: initialFav = false,
}: BookProps) {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const [isFav, setIsFav] = useState(initialFav);
  const [favLoading, setFavLoading] = useState(false);

  const handleFavourite = async () => {
    setFavLoading(true);
    try {
      if (isFav) {
        // Remove
        const res = await fetch("/api/favorites/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: id }),
        });
        if (res.ok) {
          setIsFav(false);
          window.dispatchEvent(new Event("favouriteChanged"));
        }
      } else {
        // Add
        const res = await fetch("/api/favorites/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: id }),
        });
        if (res.ok) {
          setIsFav(true);
          window.dispatchEvent(new Event("favouriteChanged"));
        }
      }
    } catch (err) {
      console.error("Failed to toggle favourite", err);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <>
      <div className="border rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-lg transition bg-white h-full">
        {/* Cover Image + Favourite Button */}
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
          {/* Heart badge */}
          <button
            onClick={handleFavourite}
            disabled={favLoading}
            className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition text-lg ${
              isFav
                ? "bg-red-500 text-white"
                : "bg-white text-gray-400 hover:text-red-400"
            }`}
            title={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            {isFav ? "❤️" : "🤍"}
          </button>
        </div>

        <h3 className="mt-2 font-medium text-lg text-center line-clamp-2 w-full">{title}</h3>
        <p className="text-gray-500 text-sm line-clamp-1 w-full text-center">
          {authors?.length > 0 ? authors.join(", ") : "Unknown Author"}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {averageRating ? (
            <span className="text-yellow-500 text-sm font-semibold">★ {averageRating.toFixed(1)}</span>
          ) : null}
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {genres?.length > 0 ? genres[0] : "General"}
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

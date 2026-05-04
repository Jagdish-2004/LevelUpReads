"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface FavBook {
  _id: string;
  sourceId: string;
  title: string;
  authors: string[];
  coverImage: string | null;
  averageRating?: number;
}

export default function FavouritesSection() {
  const [books, setBooks] = useState<FavBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBooks(data.favourites || []);
      }
    } catch (err) {
      console.error("Failed to fetch favourites", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount — Redis cache serves this instantly on reload
    fetchFavourites();

    // Re-fetch only when a favourite is toggled anywhere in the app.
    // The cache was invalidated server-side so this hits MongoDB once, then
    // caches again for subsequent requests.
    const handleFavChange = () => fetchFavourites();
    window.addEventListener("favouriteChanged", handleFavChange);

    return () => {
      window.removeEventListener("favouriteChanged", handleFavChange);
    };
  }, [fetchFavourites]);

  const handleRemove = async (bookId: string) => {
    // Optimistic update
    setBooks((prev) => prev.filter((b) => b.sourceId !== bookId && b._id !== bookId));
    try {
      await fetch("/api/favorites/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
    } catch (err) {
      console.error("Failed to remove favourite", err);
      fetchFavourites(); // Re-sync on error
    }
  };

  return (
    <section className="px-6 md:px-16 mt-14 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-mono flex items-center gap-3">
          ❤️ Favourite Books
          {!loading && (
            <span className="text-sm px-3 py-1 bg-red-50 text-red-500 rounded-full font-sans">
              {books.length} saved
            </span>
          )}
        </h2>
        <Link
          href="/reader/explore"
          className="text-sm text-gray-500 hover:text-black underline transition"
        >
          Explore more →
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-xl overflow-hidden animate-pulse bg-white">
              <div className="w-full h-[200px] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && books.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <span className="text-5xl block mb-3">🤍</span>
          <p className="text-gray-500 font-medium">No favourites yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Hit the ❤️ button on any book in Explore to save it here.
          </p>
          <Link
            href="/reader/explore"
            className="mt-4 inline-block px-6 py-2 bg-black text-white rounded-full text-sm hover:opacity-80 transition"
          >
            Browse Books
          </Link>
        </div>
      )}

      {/* Favourites grid */}
      {!loading && books.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((b) => (
            <div
              key={b._id}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition bg-white flex flex-col"
            >
              <div className="relative w-full h-[200px] bg-gray-100">
                {b.coverImage ? (
                  <Image src={b.coverImage} alt={b.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-4xl">📚</div>
                )}
                <button
                  onClick={() => handleRemove(b.sourceId || b._id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition text-sm"
                  title="Remove from favourites"
                >
                  ❤️
                </button>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{b.title}</h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                  {b.authors?.join(", ") || "Unknown Author"}
                </p>
                {b.averageRating && b.averageRating > 0 && (
                  <p className="text-yellow-500 text-sm mt-1">★ {b.averageRating.toFixed(1)}</p>
                )}
                <div className="mt-auto pt-3">
                  <Link
                    href={`/books/${b.sourceId || b._id}`}
                    className="block w-full py-2 bg-black text-white text-center rounded-full text-sm hover:opacity-80 transition"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

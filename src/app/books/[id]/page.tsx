"use client";

import { useEffect, useState, use } from "react";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import BookDetails from "@/components/BookDetails";
import { useRouter } from "next/navigation";

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavourited, setIsFavourited] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        // Fetch book details and current favourites in parallel
        const [bookRes, favRes] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch("/api/favorites"),
        ]);

        if (!bookRes.ok) {
          throw new Error(bookRes.status === 404 ? "Book not found" : "Failed to fetch book details");
        }

        const bookData = await bookRes.json();
        setBook(bookData);

        // Check if this book is already in user's favourites
        // Use both the populated sourceIds AND the raw stored ids for reliable matching
        if (favRes.ok) {
          const favData = await favRes.json();
          const storedIds: string[] = favData.ids || [];
          const populatedSourceIds = (favData.favourites || []).map((b: any) => b.sourceId);
          const allIds = [...storedIds, ...populatedSourceIds];
          setIsFavourited(
            allIds.includes(bookData.sourceId) ||
            allIds.includes(id) ||
            allIds.includes(bookData._id)
          );
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />

      <div className="px-10 py-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-black font-medium transition flex items-center gap-2"
        >
          ← Back to Explore
        </button>
      </div>

      <section className="px-6 md:px-10 pb-20 flex-grow w-full max-w-7xl mx-auto">
        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto w-full mt-10 animate-pulse">
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="w-full max-w-[300px] aspect-[2/3] bg-gray-200 rounded-xl" />
            </div>
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-gray-200 rounded-full w-20" />
                <div className="h-8 bg-gray-200 rounded-full w-24" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto mt-10 text-center">
            <span className="text-5xl block mb-4">😿</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => router.push("/reader/explore")}
              className="px-6 py-2 bg-black text-white rounded-full font-medium hover:opacity-80 transition"
            >
              Browse other books
            </button>
          </div>
        )}

        {/* Book details */}
        {!loading && !error && book && (
          <BookDetails book={book} isFavourited={isFavourited} />
        )}
      </section>

      <Footer />
    </main>
  );
}

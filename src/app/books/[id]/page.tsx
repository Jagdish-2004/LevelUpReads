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

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/books/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Book not found");
          throw new Error("Failed to fetch book details");
        }
        const data = await res.json();
        setBook(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchBook();
    }
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
        {loading && (
          <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto w-full mt-10 animate-pulse">
            <div className="w-full md:w-1/3 flex justify-center">
               <div className="w-full max-w-[300px] aspect-[2/3] bg-gray-200 rounded-xl"></div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                <div className="h-8 bg-gray-200 rounded-full w-24"></div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )}

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

        {!loading && !error && book && (
          <BookDetails book={book} />
        )}
      </section>

      <Footer />
    </main>
  );
}

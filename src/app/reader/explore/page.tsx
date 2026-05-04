"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import BookCard from "@/components/BookCard";
import SearchBar from "@/components/SearchBar";

const categories = ["All", "Mystery", "Fantasy", "Thriller", "Fiction", "Non-fiction", "Science", "History"];

export default function ExploreBooks() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, activeCategory]);

  const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch books");
    return res.json();
  });

  const getUrl = () => {
    let finalQuery = debouncedQuery.trim();
    if (activeCategory !== "All") {
      finalQuery = finalQuery ? `${finalQuery} ${activeCategory}` : activeCategory;
    }
    if (finalQuery) {
      return `/api/books?query=${encodeURIComponent(finalQuery)}&page=${page}&limit=12`;
    }
    return `/api/books/trending?page=${page}&limit=12`;
  };

  const { data, error, isLoading } = useSWR(getUrl(), fetcher, {
    keepPreviousData: true,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* TITLE + IMAGE */}
      <section className="px-10 py-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-mono">Explore Books</h1>
          <p className="text-gray-600 mt-2">Discover new worlds and add to your library.</p>
        </div>
        <span className="text-6xl hidden md:block">📚</span>
      </section>

      {/* SEARCH BAR */}
      <div className="px-10 flex justify-center w-full">
         <SearchBar onSearch={handleSearch} />
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-4 px-10 mt-8 flex-wrap justify-center max-w-5xl mx-auto w-full">
        {categories.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(c)}
            className={`px-5 py-2 rounded-full border text-sm transition font-medium
              ${
                activeCategory === c
                  ? "bg-black text-white border-black shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 hover:text-black"
              }
            `}
          >
            {c}
          </button>
        ))}
      </div>

      {/* STATUS AND GRID */}
      <section className="px-10 py-12 max-w-7xl mx-auto w-full flex-grow">
        
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array(8).fill(0).map((_, i) => (
               <div key={i} className="animate-pulse flex flex-col items-center border rounded-xl p-4 bg-gray-50 h-[380px]">
                  <div className="w-full h-[220px] bg-gray-200 rounded-lg mb-4"></div>
                  <div className="w-3/4 h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
               </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-10 text-red-500">
            <p>Oops! {error.message || "Failed to load books"}</p>
          </div>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="text-center py-20 text-gray-500">
             <span className="text-4xl block mb-4">📚</span>
             <p className="text-lg">No books found for "{debouncedQuery || activeCategory}".</p>
             <p className="text-sm mt-2">Try adjusting your search or categories.</p>
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <>
            <h2 className="text-2xl font-mono mb-6">
               {debouncedQuery ? "Search Results" : activeCategory === "All" ? "Trending Now" : `${activeCategory} Books`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {data.map((book: any) => (
                <BookCard
                  key={book._id || book.id}
                  id={book.sourceId || book._id || book.id}
                  title={book.title}
                  authors={book.authors}
                  genres={book.genres}
                  coverImage={book.coverImage}
                  averageRating={book.averageRating}
                  description={book.description || ""}
                  xpValue={book.xpValue || 20}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-12 flex justify-center w-full">
              {page > 1 && (
                <button 
                  onClick={() => setPage(p => p - 1)}
                  className="px-6 py-2 border border-black text-black rounded-l-full hover:bg-gray-50"
                >
                  ← Previous
                </button>
              )}
              <span className="px-6 py-2 border-t border-b border-black flex items-center bg-gray-50 font-mono">
                Page {page}
              </span>
              <button 
                onClick={() => handleLoadMore()}
                className="px-6 py-2 border border-black text-black rounded-r-full hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </section>

      {/* <Footer /> */}
    </main>
  );
}
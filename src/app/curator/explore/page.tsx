"use client";
import Image from "next/image";
import { useState } from "react";
import Header from "@/app/curator/header/page";
import Footer from "@/app/footer/page"

export default function ExploreBooksCurator() {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "Mystery", "Fantasy", "Thriller"];

  const books = Array(9).fill({
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    image: "/book_sample.jpg", // replace with your actual path
  });

  return (
    <div className="min-h-screen bg-white text-black font-[Poppins]">
      <Header />

      {/* PAGE HEADER */}
      <div className="flex justify-between items-start px-10 mt-10">
        <div>
          <h1 className="text-3xl font-bold">Explore Books</h1>
          <p className="text-sm text-gray-600">Curate books that inspire the community.</p>
        </div>

        <Image
          src="/curator_books.png"
          alt="Curator Illustration"
          width={190}
          height={190}
          className="object-contain"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="px-10 mt-6">
        <div className="flex items-center space-x-2 border px-4 py-2 rounded-full shadow-sm">
          <span className="text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Search for books, authors, genres"
            className="w-full outline-none text-sm"
          />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex px-10 space-x-3 mt-5">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-1 rounded-full border text-sm transition ${
              selectedFilter === filter
                ? "bg-black text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* BOOK GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-10 mt-10 pb-20">
        {books.map((book, index) => (
          <div
            key={index}
            className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
          >
            <Image
              src={book.image}
              alt={book.title}
              width={200}
              height={260}
              className="w-full rounded-xl"
            />

            <h3 className="mt-4 font-semibold text-lg">{book.title}</h3>
            <p className="text-sm text-gray-700">{book.author}</p>
            <p className="text-xs text-gray-500">{book.genre}</p>

            <button className="mt-4 w-full px-4 py-2 bg-black text-white rounded-full text-sm hover:opacity-80 transition">
              Curate Book →
            </button>
          </div>
        ))}
      </div>

      <Footer />

      <div className="text-center text-xs py-4 text-gray-500">
        © 2025 levelupReads. Made with love for readers everywhere.
      </div>
    </div>
  );
}

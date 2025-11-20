"use client";

import Image from "next/image";
import { useState } from "react";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page"

const categories = ["All", "Mystery", "Fantasy", "Thriller"];

const books = Array(9).fill({
  title: "The Midnight Library",
  author: "Matt Haig",
  genre: "Fiction",
  img: "/image.png",
});

export default function ExploreBooks() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <main className="min-h-screen bg-white font-sans">

      <Header />

      {/* TITLE + SNOOPY */}
      <section className="px-10 py-10 flex justify-between items-center">
        <h1 className="text-3xl font-mono">Explore Books</h1>

        <Image
          src="/snoopy_books.png"
          alt="snoopy reading"
          width={160}
          height={160}
          className="object-contain"
        />
      </section>

      {/* SEARCH BAR */}
      <div className="px-10 w-full max-w-3xl">
        <div className="flex items-center gap-3 border px-4 py-2 rounded-full w-full">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search for books, authors, genres"
            className="w-full outline-none text-sm"
          />
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-4 px-10 mt-6 flex-wrap">
        {categories.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(c)}
            className={`px-5 py-1.5 rounded-full border text-sm transition
              ${
                activeCategory === c
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }
            `}
          >
            {c}
          </button>
        ))}
      </div>

      {/* BOOK GRID */}
      <section className="px-10 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

        {books.map((book, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-lg transition"
          >
            <Image
              src={book.img}
              alt={book.title}
              width={150}
              height={200}
              className="rounded-lg"
            />

            <h3 className="mt-4 font-medium text-lg text-center">
              {book.title}
            </h3>
            <p className="text-gray-500 text-sm">{book.author}</p>
            <p className="text-gray-500 text-sm">{book.genre}</p>

            <button className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm hover:opacity-80">
              Read more →
            </button>
          </div>
        ))}

      </section>

      
      <Footer />

    </main>
  );
}
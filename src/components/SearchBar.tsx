"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query, onSearch]);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 border px-4 py-3 rounded-full w-full bg-white shadow-sm focus-within:ring-2 focus-within:ring-black transition">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books, authors, genres..."
          className="w-full outline-none text-sm bg-transparent"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-black">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

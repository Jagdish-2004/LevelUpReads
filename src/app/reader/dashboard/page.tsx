"use client";

import Image from "next/image";
import Link from "next/link";
import Footer from "@/app/footer/page"
import Header from "@/app/header/page";

export default function ReaderDashboard() {
  return (
    <main className="min-h-screen bg-white font-sans">

      <Header />

      {/* QUICK STATS */}
      <section className="px-16 mt-4">
        <h2 className="text-3xl font-mono mb-6">Quick Stats!</h2>

        <div className="flex gap-20 text-center">
          <div>
            <h3 className="text-4xl font-semibold">45</h3>
            <p className="text-gray-600 mt-1">Books Read</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">25</h3>
            <p className="text-gray-600 mt-1">Challenges done</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">2K+</h3>
            <p className="text-gray-600 mt-1">Followers</p>
          </div>
        </div>
      </section>

      {/* XP LEVEL */}
      <section className="px-16 mt-10">
        <h2 className="text-2xl font-mono mb-4">XP Level</h2>

        {/* Progress bar wrapper */}
        <div className="w-full h-4 bg-gray-200 rounded-full">
          <div
            className="h-4 bg-black rounded-full"
            style={{ width: "70%" }} // level progress
          />
        </div>

        <p className="mt-2 text-gray-700 font-mono">level 7</p>
      </section>

      {/* CONTINUE READING */}
      <section className="px-16 mt-14 mb-16">
        <h2 className="text-3xl font-mono mb-10">Continue Reading..</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="border p-4 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              <Image
                src="/image.png"
                alt="Book Cover"
                width={300}
                height={300}
                className="rounded-xl mb-4"
              />

              <h3 className="text-xl font-medium">The Midnight Library</h3>
              <p className="text-gray-700">Matt Haig</p>
              <p className="text-gray-500 text-sm">Fiction</p>

              <button className="mt-4 w-full py-2 bg-black text-white rounded-full hover:opacity-90">
                Read more →
              </button>
            </div>
          ))}

        </div>
      </section>

      <Footer />
    </main>
  );
}

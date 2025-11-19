"use client";

import Image from "next/image";
import Link from "next/link";

export default function ReaderDashboard() {
  return (
    <main className="min-h-screen bg-white font-sans">

      {/* HEADER */}
      <header className="px-6 md:px-16 py-6 flex justify-between items-center border-b">
        <h1 className="text-3xl font-mono">Reader Dashboard</h1>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-10 text-gray-700 text-lg">
          <Link href="/">home</Link>
          <Link href="/explore">explore</Link>
          <Link href="/leaderboard">leaderboard</Link>
          <Link href="/contact">contact</Link>
        </nav>

          <Image
            src="/profile.png"
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border"
          />
        </div>
      </header>

      {/* MAIN SECTION */}
      <section className="px-6 md:px-16 py-14">
        
        <h2 className="text-4xl font-semibold mb-10">
          Welcome, Reader 👋
        </h2>

        {/* GRID OF FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* EXPLORE BOOKS */}
          <Link
            href="/reader/books"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/books_snoop.jpg')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Explore Books</h3>
              <p className="opacity-90 mt-2 text-sm">
                Browse books, genres & trending reads.
              </p>
            </div>
          </Link>

          {/* JOIN CHALLENGES */}
          <Link
            href="/reader/challenges"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/bg-challenges.jpg')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Join Challenges</h3>
              <p className="opacity-90 mt-2 text-sm">
                Participate in fun and engaging reading challenges.
              </p>
            </div>
          </Link>

          {/* READER COMMUNITIES */}
          <Link
            href="/reader/communities"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/discover-community.png')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Communities</h3>
              <p className="opacity-90 mt-2 text-sm">
                Join discussions, meet other readers & share insights.
              </p>
            </div>
          </Link>

          {/* YOUR PROGRESS */}
          <Link
            href="/reader/progress"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/rewards_snoop.jpg')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Your Progress</h3>
              <p className="opacity-90 mt-2 text-sm">
                Track your reading stats, streaks & achievements.
              </p>
            </div>
          </Link>

          {/* SUBMIT REVIEWS */}
          <Link
            href="/reader/reviews"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/bg-approve.jpg')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Submit Reviews</h3>
              <p className="opacity-90 mt-2 text-sm">
                Share your thoughts about the books you read.
              </p>
            </div>
          </Link>

          {/* REWARDS & XP */}
          <Link
            href="/reader/rewards"
            className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
            style={{ backgroundImage: "url('/bg-analytics.jpg')" }}
          >
            <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
              <h3 className="text-xl font-medium">Rewards & XP</h3>
              <p className="opacity-90 mt-2 text-sm">
                Earn XP, badges and unlock reading achievements.
              </p>
            </div>
          </Link>

        </div>

      </section>
    </main>
  );
}

x"use client";

import Image from "next/image";
import Link from "next/link";

export default function CuratorDashboard() {
  return (
    <main className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full flex justify-between items-center py-4 px-10 border-b">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="font-mono text-xl">levelupReads</span>
        </div>

        <ul className="flex gap-10 font-mono text-lg">
          <li><Link href="/">home</Link></li>
          <li><Link href="/explore">explore</Link></li>
          <li><Link href="/community">community</Link></li>
          <li><Link href="/leaderboard">leaderboard</Link></li>
        </ul>

        <button className="px-4 py-2 rounded-full bg-black text-white hover:opacity-90">
          Join now
        </button>
      </nav>

      {/* HEADER */}
      <section className="px-16 py-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-mono mb-2">Curator Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back, Curator! Your knowledge guides the community.
          </p>
        </div>

        <Image
          src="/snoopy.png"
          alt="Snoopy"
          width={180}
          height={180}
          className="object-contain"
        />
      </section>

      {/* QUICK STATS */}
      <section className="px-16 mt-4">
        <h2 className="text-3xl font-mono mb-6">Quick Stats!</h2>

        <div className="flex gap-20 text-center">
          <div>
            <h3 className="text-4xl font-semibold">45</h3>
            <p className="text-gray-600 mt-1">Books Curated</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">25</h3>
            <p className="text-gray-600 mt-1">Challenges Created</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">5K+</h3>
            <p className="text-gray-600 mt-1">Followers</p>
          </div>
        </div>
      </section>

      {/* RECENT BOOKS */}
      <section className="px-16 mt-14 mb-16">
        <h2 className="text-3xl font-mono mb-10">Recently added books</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="border p-4 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              <Image
                src="/midnightlibrary.jpg"
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

      {/* FOOTER */}
      <footer className="w-full bg-gray-100 py-10 px-16 border-t">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* LOGO */}
          <div>
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mb-3" />
            <p className="text-gray-600 text-sm">
              Track progress, earn badges, and inspire reading friends!
            </p>
          </div>

          {/* EXPLORE */}
          <div>
            <h4 className="font-semibold mb-2">Explore</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>browse books</li>
              <li>earn challenges</li>
              <li>badges and rewards</li>
              <li>genre guide</li>
            </ul>
          </div>

          {/* HELP */}
          <div>
            <h4 className="font-semibold mb-2">Need Help?</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>help center</li>
              <li>start reading</li>
              <li>reading tips</li>
              <li>user guide</li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="font-semibold mb-2">Call us</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>Mumbai</li>
              <li>+91 909 999 99</li>
              <li>levelupreads@gmail.com</li>
            </ul>
          </div>

        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 LevelupBooks. Made with love for readers everywhere.
        </p>
      </footer>
    </main>
  );
}

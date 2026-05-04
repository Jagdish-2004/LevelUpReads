import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import connectToDatabase from "@/backend/lib/db";
import { Book } from "@/backend/models/Book";
import { User } from "@/backend/models/User";
import Link from "next/link";
import FavouritesSection from "@/components/FavouritesSection";

// Always fetch fresh — no caching so favourite changes reflect immediately
export const dynamic = "force-dynamic";

export default async function ReaderDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  await connectToDatabase();

  // Sync / fetch user from Mongoose
  let userData: any = null;
  if (session?.user?.email) {
    userData = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $setOnInsert: {
          name: session.user.name,
          email: session.user.email,
          emailVerified: session.user.emailVerified ?? false,
          image: session.user.image ?? "",
          role: "reader",
          xp: 0,
          booksRead: 0,
        },
      },
      { upsert: true, returnDocument: "after", lean: true }
    );
  }

  // Leaderboard rank
  let rank = null;
  if (userData) {
    rank = (await User.countDocuments({ xp: { $gt: (userData as any).xp } })) + 1;
  }

  const displayUser: any = userData ?? { name: "Reader", xp: 0, booksRead: 0 };

  // Recently read books (from readBookIds)
  const readIds: string[] = (displayUser.readBookIds || []).slice(-3).reverse();
  const readBooks = readIds.length > 0
    ? await Book.find({ sourceId: { $in: readIds } }).lean()
    : [];

  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-4xl font-mono mb-2">Reader Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back, <span className="font-semibold">{displayUser.name}</span>! Keep the streak alive.
          </p>
        </div>
        <Image
          src="/books_snoop.jpg"
          alt="Snoopy"
          width={180}
          height={180}
          className="object-contain mt-6 md:mt-0"
        />
      </section>

      {/* Stats */}
      <section className="px-6 md:px-16 mt-4">
        <h2 className="text-3xl font-mono mb-6">User Analysis &amp; Stats</h2>
        <div className="flex gap-6 flex-wrap">
          <div className="bg-gray-50 p-6 rounded-2xl flex-1 min-w-[150px] shadow-sm border border-gray-100 text-center">
            <h3 className="text-4xl font-semibold text-blue-600">{displayUser.booksRead || 0}</h3>
            <p className="text-gray-600 mt-2 font-medium">Books Read</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl flex-1 min-w-[150px] shadow-sm border border-gray-100 text-center">
            <h3 className="text-4xl font-semibold text-green-600">{displayUser.xp || 0}</h3>
            <p className="text-gray-600 mt-2 font-medium">Total XP</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl flex-1 min-w-[150px] shadow-sm border border-gray-100 text-center">
            <h3 className="text-4xl font-semibold text-yellow-600">#{rank ?? "-"}</h3>
            <p className="text-gray-600 mt-2 font-medium">Leaderboard Rank</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl flex-1 min-w-[150px] shadow-sm border border-gray-100 text-center">
            <h3 className="text-4xl font-semibold text-red-500">{(displayUser.favouriteBookIds || []).length}</h3>
            <p className="text-gray-600 mt-2 font-medium">Favourites</p>
          </div>
        </div>
      </section>

      {/* XP Level Bar */}
      <section className="px-6 md:px-16 mt-10">
        <h2 className="text-2xl font-mono mb-4">Level Progress</h2>
        <div className="w-full h-4 bg-gray-200 rounded-full max-w-3xl overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(displayUser.xp % 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between max-w-3xl mt-2 text-sm text-gray-500 font-medium">
          <span>Level {Math.floor(displayUser.xp / 100) + 1}</span>
          <span>{100 - (displayUser.xp % 100)} XP to next level</span>
        </div>
      </section>

      {/* Reading History */}
      <section className="px-6 md:px-16 mt-14">
        <h2 className="text-3xl font-mono mb-6 flex items-center gap-3">
          Reading History
          <span className="text-sm px-3 py-1 bg-gray-100 rounded-full text-gray-500 font-sans">Recent</span>
        </h2>
        {readBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">📖</span>
            <p>No books completed yet. Take a quiz to earn XP!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {readBooks.map((b: any) => (
              <div
                key={b._id.toString()}
                className="flex items-center gap-6 p-4 rounded-xl border border-gray-100 shadow-sm bg-white hover:bg-gray-50 transition"
              >
                <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                  {b.coverImage ? (
                    <Image src={b.coverImage} alt={b.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-2xl">📚</div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-900">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.authors?.join(", ")}</p>
                </div>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg text-sm">
                    +{b.xpValue || 20} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FAVOURITE BOOKS — live client fetch ── */}
      <FavouritesSection />
    </main>
  );
}
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import connectToDatabase from "@/backend/lib/db";
import { Book } from "@/backend/models/Book";
import { User } from "@/backend/models/User";

export default async function ReaderDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await connectToDatabase();

  // Fetch real user from our Mongoose model, sync from session if missing
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

  // Compute leaderboard rank for the current user
  let rank = null;
  if (userData) {
    rank = await User.countDocuments({ xp: { $gt: userData.xp } }) + 1;
  }

  const fallbackUser = { name: "Reader", xp: 0, booksRead: 0 };
  const displayUser = userData ?? fallbackUser;

  const allBooks = await Book.find({}).lean();

  const readingHistory = allBooks.slice(0, 3); // Mocking history with first 3 books

  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />
      
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

      {/* DYNAMIC STATS */}
      <section className="px-6 md:px-16 mt-4">
        <h2 className="text-3xl font-mono mb-6">User Analysis & Stats</h2>
        <div className="flex gap-10 md:gap-20 text-center flex-wrap">
          <div className="bg-gray-50 p-6 rounded-2xl w-full md:w-auto flex-1 min-w-[150px] shadow-sm border border-gray-100">
            <h3 className="text-4xl font-semibold text-blue-600">{displayUser.booksRead || 0}</h3>
            <p className="text-gray-600 mt-2 font-medium">Books Read</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl w-full md:w-auto flex-1 min-w-[150px] shadow-sm border border-gray-100">
            <h3 className="text-4xl font-semibold text-green-600">{displayUser.xp || 0}</h3>
            <p className="text-gray-600 mt-2 font-medium">Total XP</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl w-full md:w-auto flex-1 min-w-[150px] shadow-sm border border-gray-100">
            <h3 className="text-4xl font-semibold text-yellow-600">#{rank ?? "-"}</h3>
            <p className="text-gray-600 mt-2 font-medium">Leaderboard Rank</p>
          </div>
        </div>
      </section>

      {/* XP LEVEL BAR */}
      <section className="px-6 md:px-16 mt-10">
        <h2 className="text-2xl font-mono mb-4">Level Progress</h2>
        <div className="w-full h-4 bg-gray-200 rounded-full max-w-3xl overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((displayUser.xp % 100), 100)}%` }} 
          />
        </div>
        <div className="flex justify-between max-w-3xl mt-2 text-sm text-gray-500 font-medium">
          <span>Level {Math.floor(displayUser.xp / 100) + 1}</span>
          <span>{100 - (displayUser.xp % 100)} XP to next level</span>
        </div>
      </section>

      {/* READING HISTORY */}
      <section className="px-6 md:px-16 mt-14">
        <h2 className="text-3xl font-mono mb-6 flex items-center gap-3">
          Reading History
          <span className="text-sm px-3 py-1 bg-gray-100 rounded-full text-gray-500 font-sans">Recent</span>
        </h2>
        {readingHistory.length === 0 ? (
          <p className="text-gray-500 italic">No history available yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {readingHistory.map((b) => (
              <div key={`history-${b._id.toString()}`} className="flex items-center gap-6 p-4 rounded-xl border border-gray-100 shadow-sm bg-white hover:bg-gray-50 transition">
                <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                  {b.coverImage ? (
                    <Image src={b.coverImage} alt={b.title} fill className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-900">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.authors?.join(", ")}</p>
                  <p className="text-xs text-gray-400 mt-1">Finished on May 2nd, 2026</p>
                </div>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg text-sm">+{b.xpValue || 20} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LIBRARY */}
      <section className="px-6 md:px-16 mt-14 mb-16">
        <h2 className="text-3xl font-mono mb-10">Library</h2>
        {allBooks.length === 0 ? (
           <p className="text-gray-500 italic">No books available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {allBooks.map((b) => (
              <div key={b._id.toString()} className="border p-4 rounded-2xl shadow-sm hover:shadow-lg transition flex flex-col">
                 <div className="relative w-full h-[300px] mb-4 bg-gray-100 rounded-xl overflow-hidden">
                   {b.coverImage ? (
                      <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">No Cover</div>
                   )}
                 </div>
                <h3 className="text-xl font-medium">{b.title}</h3>
                <p className="text-gray-700">{b.authors?.join(", ")}</p>
                <p className="text-gray-500 text-sm mb-4">{b.genres?.join(", ")}</p>
                <div className="mt-auto">
                    <a href={`/books/${b.sourceId || b._id}`} className="block w-full py-2 bg-black text-white text-center rounded-full hover:opacity-90 transition">Read more →</a>
                    <div className="text-center mt-2 text-xs text-gray-500">Yields {b.xpValue} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
    </main>
  );
}
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import { db } from "@/db";
import { book, user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ReaderDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch fresh user data for XP and Stats
  const [userData] = await db.select().from(userTable).where(eq(userTable.id, session.user.id));
  const allBooks = await db.select().from(book);

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* <Header /> */}
      
      <section className="px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-4xl font-mono mb-2">Reader Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back, <span className="font-semibold">{userData.name}</span>! Keep the streak alive.
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
        <h2 className="text-3xl font-mono mb-6">Quick Stats!</h2>
        <div className="flex gap-10 md:gap-20 text-center">
          <div>
            <h3 className="text-4xl font-semibold">{userData.booksRead || 0}</h3>
            <p className="text-gray-600 mt-1">Books Read</p>
          </div>
          <div>
            <h3 className="text-4xl font-semibold">{userData.xp || 0} XP</h3>
            <p className="text-gray-600 mt-1">Total Experience</p>
          </div>
        </div>
      </section>

      {/* XP LEVEL BAR */}
      <section className="px-6 md:px-16 mt-10">
        <h2 className="text-2xl font-mono mb-4">XP Level</h2>
        <div className="w-full h-4 bg-gray-200 rounded-full max-w-3xl overflow-hidden">
          <div
            className="h-4 bg-black rounded-full transition-all duration-500"
            // Simple level calculation: Level = XP / 100
            style={{ width: `${Math.min((userData.xp % 100), 100)}%` }} 
          />
        </div>
        <p className="mt-2 text-gray-700 font-mono">Level {Math.floor(userData.xp / 100) + 1}</p>
      </section>

      {/* LIBRARY */}
      <section className="px-6 md:px-16 mt-14 mb-16">
        <h2 className="text-3xl font-mono mb-10">Library</h2>
        {allBooks.length === 0 ? (
           <p className="text-gray-500 italic">No books available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {allBooks.map((b) => (
              <div key={b.id} className="border p-4 rounded-2xl shadow-sm hover:shadow-lg transition flex flex-col">
                <div className="relative w-full h-[300px] mb-4 bg-gray-100 rounded-xl overflow-hidden">
                   {b.coverUrl ? (
                      <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">No Cover</div>
                   )}
                </div>
                <h3 className="text-xl font-medium">{b.title}</h3>
                <p className="text-gray-700">{b.author}</p>
                <p className="text-gray-500 text-sm mb-4">{b.genre}</p>
                <div className="mt-auto">
                    <button className="w-full py-2 bg-black text-white rounded-full hover:opacity-90">Read more →</button>
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
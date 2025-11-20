import { db } from "@/db";
import { user } from "@/db/schema";
import { desc } from "drizzle-orm";
import Header from "@/app/reader/header/page";
import Footer from "@/app/footer/page";
import Image from "next/image";

// Force dynamic rendering to get latest leaderboard on refresh
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  // Fetch top 10 users sorted by XP
  const topUsers = await db.select()
    .from(user)
    .orderBy(desc(user.xp))
    .limit(10);

  return (
    <div>
      <Header />
      <div className="w-full min-h-screen flex flex-col items-center bg-white py-12">
        <h1 className="text-5xl font-semibold tracking-wide mb-2">Leaderboard</h1>
        <p className="text-gray-600 text-lg mb-10 text-center">
          Top readers of the community!
        </p>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Leaderboard List */}
          <div className="bg-[#fffdd0] w-full md:w-[480px] rounded-3xl shadow-xl px-8 py-6 border border-gray-300">
            <h2 className="text-3xl font-semibold text-center mb-6">Top Readers</h2>
            <div className="flex flex-col gap-4">
              {topUsers.map((u, index) => (
                <div key={u.id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-medium w-6">{index + 1}.</span>
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                        {u.image ? <img src={u.image} className="rounded-full"/> : "👤"}
                    </div>
                    <div>
                      <p className="text-lg font-medium">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.booksRead} books read</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{u.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="hidden md:block">
             <Image 
               src="/rewards_snoop.jpg" 
               alt="Winner Snoopy" 
               width={320} 
               height={420} 
               className="object-cover rounded-3xl shadow-md"
             />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
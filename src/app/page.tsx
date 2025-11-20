// import Header from "@/app/header/page";
import Image from "next/image";
import Footer from "@/app/footer/page"
import HomePage from "@/app/home/page";
import ExplorePage from "./reader/explore/page";
import LeaderboardPage from "./leaderboard/page";
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* <Header /> */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LEFT — LOGO */}
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/logo.png"     // <-- make sure this name matches the file
            alt="LevelupReads Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">levelupReads</span>
        </Link>


        {/* RIGHT — JOIN BUTTON */}
        <Link
          href="/roleselection"
          className="px-6 py-2 bg-black text-white rounded-full text-lg hover:opacity-80"
        >
          join now
        </Link>

      </div>
      <HomePage />
      {/* <Footer /> */}
    </main>
  );
}


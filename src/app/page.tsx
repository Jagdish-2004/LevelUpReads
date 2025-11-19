import Header from "@/app/header/page";
import Image from "next/image";
import Footer from "@/app/footer/page"
import HomePage from "@/app/home/page";
import ExplorePage from "./reader/explore/page";
import LeaderboardPage from "./leaderboard/page";

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />
      <HomePage />
      <Footer />
    </main>
  );
}


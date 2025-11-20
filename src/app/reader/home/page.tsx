import Header from "@/app/reader/header/page";
import Image from "next/image";
import Footer from "@/app/footer/page"
import HomePage from "@/app/reader/home/page";
import ExplorePage from "../explore/page";
import LeaderboardPage from "../leaderboard/page";
// import { Contact } from "lucide-react";
import Contact from "@/app/contact/page"
export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />
      <HomePage />
      {/* <LeaderboardPage/> */}
      <section id ="contact"><Contact /></section>
      <Footer />
    </main>
  );
}


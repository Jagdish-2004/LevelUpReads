import Header from "@/app/curator/header/page";
import Image from "next/image";
import Footer from "@/app/footer/page"
import HomePage from "@/app/curator/dashboard/page";
import ExplorePage from "@/app/curator/explore/page";
import LeaderboardPage from "../leaderboard/page";
import Contact from "../contact/page";
export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />
      <HomePage />
      <section id='contact'><Contact/></section>
      <Footer />
    </main>
  );
}


import Image from "next/image";
import Leaderboard from "../leaderboard/page";
import Header from "@/app/header/page";
export default function CuratorDashboard() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* HEADER */}
      <header className="px-6 md:px-16 py-6 flex justify-between items-center border-b">
        <h1 className="text-3xl font-mono">Curator Dashboard</h1>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-full bg-black text-white hover:opacity-80">
            Notifications
          </button>

          <Image
            src="/rewards_snoop.jpg"
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
          Welcome, Curator 👋
        </h2>

        {/* GRID OF FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* CREATE COMMUNITY */}
<a
  href="/curator/create-community"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/discover-community.png')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Create Community</h3>
    <p className="opacity-90 mt-2 text-sm">
      Start a new reading club or discussion group.
    </p>
  </div>
</a>

          {/* ADD BOOKS */}
<a
  href="/curator/add-book"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/books_snoop.jpg')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Add Books</h3>
    <p className="opacity-90 mt-2 text-sm">
      Add new books to the platform or your community list.
    </p>
  </div>
</a>

          {/* MANAGE CHALLENGES */}
<a
  href="/snoopy_left.png"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/bg-challenges.jpg')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Manage Challenges</h3>
    <p className="opacity-90 mt-2 text-sm">
      Create, edit, or publish new reading challenges.
    </p>
  </div>
</a>

{/* APPROVE SUBMISSIONS */}
<a
  href="/curator/approvals"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/bg-approve.jpg')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Approve Submissions</h3>
    <p className="opacity-90 mt-2 text-sm">
      Approve reviews, posts, and challenge completions.
    </p>
  </div>
</a>

{/* USER MANAGEMENT */}
<a
  href="/curator/users"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/bg-users.jpg')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Manage Users</h3>
    <p className="opacity-90 mt-2 text-sm">
      View and manage community members.
    </p>
  </div>
</a>

{/* ANALYTICS */}
<a
  href="/curator/explore"
  className="p-6 rounded-2xl border hover:shadow-xl transition bg-cover bg-center text-white relative overflow-hidden"
  style={{ backgroundImage: "url('/bg-analytics.jpg')" }}
>
  <div className="backdrop-blur-sm bg-black/40 p-4 rounded-xl inline-block">
    <h3 className="text-xl font-medium">Explore</h3>
    <p className="opacity-90 mt-2 text-sm">
      Track user activity, engagement, and reading stats.
    </p>
  </div>
</a>

        </div>

        {/* LEADERBOARD SECTION */}
<div className="flex justify-center mt-16">
  <Leaderboard />
</div>


      </section>
    </main>
  );
}



// import Image from "next/image";
// import Link from "next/link";

// export default function CuratorDashboard() {
//   return (
//     <main className="min-h-screen bg-white font-sans">

//       {/* HEADER */}
//       <header className="px-6 md:px-16 py-6 flex justify-between items-center border-b">
//         <h1 className="text-3xl font-mono">Curator Dashboard</h1>

//         <div className="flex items-center gap-4">
//           <nav className="hidden md:flex gap-10 text-gray-700 text-lg">
//           <Link href="/">home</Link>
//           <Link href="/explore">explore</Link>
//           <Link href="/leaderboard">leaderboard</Link>
//           <Link href="/contact">contact</Link>
//         </nav>

//           <Image
//             src="/rewards_snoop.jpg"
//             alt="Profile"
//             width={40}
//             height={40}
//             className="rounded-full border"
//           />
//         </div>
//       </header>

//       {/* MAIN SECTION */}
//       <section className="px-6 md:px-16 py-20">

//         <h2 className="text-4xl font-semibold mb-6">
//           Welcome, Curator 👋
//         </h2>

//         <p className="text-gray-700 text-lg mb-10">
//           Manage communities, books, challenges, users and more — all from your dashboard.
//         </p>

//         {/* EXPLORE BUTTON */}
//         <Link
//           href="/curator/explore"
//           className="inline-block px-8 py-4 rounded-full bg-black text-white text-lg hover:opacity-80 transition shadow-lg"
//         >
//           Go to Explore →
//         </Link>

//       </section>
//     </main>
//   );
// }

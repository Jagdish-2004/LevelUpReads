
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LEFT — LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"     // <-- make sure this name matches the file
            alt="LevelupReads Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">levelupReads</span>
        </Link>

        {/* CENTER — NAV */}
        <nav className="hidden md:flex gap-10 text-gray-700 text-lg">
          <Link href="/">home</Link>
          <Link href="/explore">explore</Link>
          <Link href="/leaderboard">leaderboard</Link>
          <Link href="/contact">contact</Link>
        </nav>

        {/* RIGHT — JOIN BUTTON */}
        <Link
          href="/roleselection"
          className="px-6 py-2 bg-black text-white rounded-full text-lg hover:opacity-80"
        >
          join now
        </Link>

      </div>
    </header>
  );
}

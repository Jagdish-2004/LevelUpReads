import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full border-b bg-white font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LEFT — LOGO */}
        <a href="/curator/home" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="LevelupReads Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">levelupReads</span>
        </a>

        {/* CENTER — NAV */}
        <nav className="hidden md:flex gap-10 text-gray-700 text-lg">
          <a href="/curator/home" className="hover:text-black">dashboard</a>
          <a href="/curator/explore" className="hover:text-black">explore</a>
          <a href="/curator/leaderboard" className="hover:text-black">leaderboard</a>
          <a href="#contact" className="hover:text-black">contact</a>
        </nav>

        {/* RIGHT — PROFILE CIRCLE */}
        <a href="#profile" className="w-11 h-11 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center">
                      {/* Replace with actual profile image */}
                      <Image
                        src="/profile.svg"
                        alt="Profile"
                        width={44}
                        height={44}
                        className="object-cover"
                      />
                    </a>

      </div>
    </header>
  );
}
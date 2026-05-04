"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Fetch real session user on mount
    authClient.getSession().then((session) => {
      if (session?.data?.user) {
        const u = session.data.user;
        setUser({
          name: u.name || "Reader",
          email: u.email || "",
          image: (u as any).image || "",
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await authClient.signOut();
    router.push("/reader/login");
  };

  const isActive = (path: string) =>
    pathname?.startsWith(path)
      ? "text-black font-bold"
      : "text-gray-500 hover:text-black transition";

  // Get initials for avatar fallback
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="w-full border-b bg-white font-sans sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LEFT — LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="LevelupReads Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">levelupReads</span>
        </Link>

        {/* CENTER — NAV */}
        <nav className="hidden md:flex gap-10 text-lg">
          <Link href="/reader/dashboard" className={isActive('/reader/dashboard')}>Dashboard</Link>
          <Link href="/reader/explore" className={isActive('/reader/explore')}>Explore</Link>
          <Link href="/reader/leaderboard" className={isActive('/reader/leaderboard')}>Leaderboard</Link>
          <Link href="/reader/contact" className={isActive('/reader/contact')}>Contact</Link>
        </nav>

        {/* RIGHT — PROFILE */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 hover:border-black flex items-center justify-center transition shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-black text-white flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 mb-1 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  {user?.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-black text-white flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "Reader"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                </div>
              </div>

              <Link
                href="/reader/profile/edit"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsDropdownOpen(false)}
              >
                ✏️ Edit Profile
              </Link>

              <Link
                href="/reader/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsDropdownOpen(false)}
              >
                📊 Dashboard
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

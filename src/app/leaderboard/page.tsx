"use client";
import React, { useEffect, useState } from "react";
// import Header from "../header/page";
import Footer from "../footer/page"
interface User {
  id: number;
  name: string;
  books: number;
  xp: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "leaderboard-update") {
        setUsers(data.leaderboard);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div>
    
    <div className="w-full min-h-screen flex flex-col items-center bg-white py-12">

      {/* Header */}
      <h1 className="text-5xl font-semibold tracking-wide mb-2">
        leaderboard!
      </h1>

      <p className="text-gray-600 text-lg mb-10 text-center">
        See our top readers! Every book you finish brings you closer to the top —
        this leaderboard updates in real time.
      </p>

      {/* Layout: Leaderboard Left — Image Right */}
      <div className="flex gap-10 items-start">

        {/* 📌 LEFT: Leaderboard */}
        <div className="bg-[#fffdd0] w-[480px] rounded-3xl shadow-xl px-8 py-6 border border-gray-300">
          <h2 className="text-3xl font-semibold text-center mb-6">top readers</h2>

          <div className="flex flex-col gap-4">
            {users.length === 0 && (
              <p className="text-center text-gray-500">Loading leaderboard...</p>
            )}

            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-medium w-6">{index + 1}.</span>

                  <img
                    src={`/avatars/user${index + 1}.png`}
                    className="w-12 h-12 rounded-full border"
                    alt="avatar"
                  />

                  <div>
                    <p className="text-lg font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.books} books read
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">
                    {user.xp.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📌 RIGHT: Image */}
        <img
          src="/images/leaderboard-right.png"
          alt="Leaderboard Graphic"
          className="w-[320px] h-[420px] object-cover rounded-3xl shadow-md"
        />
      </div>
    </div>
    
    </div>
  );
}



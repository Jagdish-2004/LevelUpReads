"use client";

import { useRef } from "react";
import Image from "next/image";
import Header from "@/app/curator/header/page";
import Footer from "@/app/footer/page";
import { addBook } from "@/actions/books"; 
import { authClient } from "@/lib/auth-client"; // Import auth client

export default function CuratorDashboard() {
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch the user session to get the name
  const { data: session } = authClient.useSession();

  const handleSubmit = async (formData: FormData) => {
    await addBook(formData);
    formRef.current?.reset();
    alert("Book added successfully!");
  };

  return (
    <main className="min-h-screen bg-white font-sans">

      <Header />

      {/* HEADER */}
      <section className="px-16 py-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-mono mb-2">Curator Dashboard</h1>
          <p className="text-gray-600 text-lg">
            {/* Dynamically display the user name */}
            Welcome back, <span className="font-semibold">{session?.user?.name || "Curator"}</span>! Your knowledge guides the community.
          </p>
        </div>

        <Image
          src="/snoopy.png" 
          alt="Snoopy"
          width={180}
          height={180}
          className="object-contain"
        />
      </section>

      {/* QUICK STATS */}
      <section className="px-16 mt-4">
        <h2 className="text-3xl font-mono mb-6">Quick Stats!</h2>

        <div className="flex gap-20 text-center">
          <div>
            <h3 className="text-4xl font-semibold">45</h3>
            <p className="text-gray-600 mt-1">Books Curated</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">25</h3>
            <p className="text-gray-600 mt-1">Challenges Created</p>
          </div>

          <div>
            <h3 className="text-4xl font-semibold">5K+</h3>
            <p className="text-gray-600 mt-1">Followers</p>
          </div>
        </div>
      </section>

      {/* --- ADD BOOK SECTION --- */}
      <section className="px-16 mt-14">
        <h2 className="text-3xl font-mono mb-6">Add to Library</h2>
        
        <div className="border border-gray-200 p-8 rounded-3xl shadow-sm max-w-2xl bg-gray-50">
             
             <form action={handleSubmit} ref={formRef} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input 
                    name="title" 
                    placeholder="e.g. The Midnight Library" 
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input 
                      name="author" 
                      placeholder="e.g. Matt Haig" 
                      className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <input 
                      name="genre" 
                      placeholder="e.g. Fiction" 
                      className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 bg-black text-white py-3 rounded-full font-medium hover:opacity-90 transition"
                >
                  + Add Book to Library
                </button>
             </form>
        </div>
      </section>

      {/* RECENT BOOKS */}
      <section className="px-16 mt-14 mb-16">
        <h2 className="text-3xl font-mono mb-10">Recently added books</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="border p-4 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              <Image
                src="/image.png"
                alt="Book Cover"
                width={300}
                height={300}
                className="rounded-xl mb-4 w-full object-cover aspect-[3/4]"
              />

              <h3 className="text-xl font-medium">The Midnight Library</h3>
              <p className="text-gray-700">Matt Haig</p>
              <p className="text-gray-500 text-sm">Fiction</p>

              <button className="mt-4 w-full py-2 bg-black text-white rounded-full hover:opacity-90">
                Read more →
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
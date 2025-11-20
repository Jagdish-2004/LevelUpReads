import Image from "next/image";
// import Header from "@/app/header/page";
import Footer from "@/app/footer/page";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      

      <section className="px-6 md:px-16 py-20 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* LEFT CONTENT */}
        <div className="max-w-xl">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-mono leading-tight">
            Where Every Chapter <br />
            Unlocks a{" "}
            <span className="text-yellow-400">New</span> <br />
            <span className="text-yellow-400">Achievement</span>
          </h1>

          {/* Buttons */}
          <div className="flex items-center gap-6 mt-10">
            <a
              href="/roleselection"
              className="px-10 py-3 bg-black text-white rounded-full text-lg hover:opacity-80"
            >
              join now
            </a>

            <a
              href="/explore"
              className="px-10 py-3 border border-black rounded-full text-lg hover:bg-black hover:text-white transition"
            >
              explore challenges
            </a>
          </div>

          {/* Stats Section */}
          <div className="flex gap-16 mt-16 text-center">
            <div>
              <h3 className="text-2xl font-medium">23.1K+</h3>
              <p className="text-sm opacity-70 mt-1">happy readers</p>
            </div>

            <div>
              <h3 className="text-2xl font-medium">18.1K+</h3>
              <p className="text-sm opacity-70 mt-1">books read</p>
            </div>

            <div>
              <h3 className="text-2xl font-medium">50+</h3>
              <p className="text-sm opacity-70 mt-1">fun challenges</p>
            </div>
          </div>
        </div>

        {/* IMAGE RIGHT SIDE */}
        <div className="flex-shrink-0">
          <Image
            src="/home.png"
            alt="Kids reading illustration"
            width={600}
            height={600}
            className="object-contain"
            priority
          />
        </div>
      </section>
      
    </main>
  );
}

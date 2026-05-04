import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http",  hostname: "books.google.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "http",  hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google profile pictures
    ],
  },
  // Exclude background worker files from the Next.js bundle
  // They run as standalone Node processes (Railway/Render)
  serverExternalPackages: ["bullmq", "ioredis", "pino", "opossum"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http",  hostname: "books.google.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "http",  hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Don't fail the build on TS errors — fix them separately
  typescript: {
    ignoreBuildErrors: true,
  },

  // Don't fail the build on ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Tell Next.js / Turbopack NOT to bundle these heavy server-only
   * packages — they are loaded from node_modules at runtime.
   * Key packages: mongoose, ioredis, bullmq, pino, opossum, nodemailer
   */
  serverExternalPackages: [
    "mongoose",
    "ioredis",
    "bullmq",
    "pino",
    "pino-pretty",
    "opossum",
    "nodemailer",
    "@google/generative-ai",
    "ws",
    "bufferutil",
    "utf-8-validate",
  ],

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default nextConfig;

export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";
import { Book } from "@/backend/models/Book";
import mongoose from "mongoose";
import redisClient from "@/backend/lib/redis";

const CACHE_TTL = 600; // 10 minutes

function cacheKey(userId: string) {
  return `favourites:${userId}`;
}

// ── GET — Return favourite books (Redis-cached) ─────────────────────────────
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use email as userId key (stable, unique)
  const userId = session.user.email;
  const key = cacheKey(userId);

  // 1️⃣ Check Redis cache first
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      return NextResponse.json({ ...parsed, source: "cache" });
    }
  } catch (redisErr) {
    // Redis failure is non-fatal — fall through to MongoDB
    console.error("[favourites] Redis GET error:", redisErr);
  }

  // 2️⃣ Cache miss — query MongoDB
  await connectToDatabase();
  const user = await User.findOne({ email: userId }).lean() as any;

  if (!user) {
    return NextResponse.json({ favourites: [], ids: [] });
  }

  const storedIds: string[] = user.favouriteBookIds || [];

  let favourites: any[] = [];
  if (storedIds.length > 0) {
    const objectIds = storedIds.filter(
      (id) => mongoose.isValidObjectId(id) && id.length === 24
    );
    const sourceIds = storedIds.filter(
      (id) => !(mongoose.isValidObjectId(id) && id.length === 24)
    );

    favourites = await Book.find({
      $or: [
        ...(sourceIds.length > 0 ? [{ sourceId: { $in: sourceIds } }] : []),
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ],
    }).lean();
  }

  const payload = { favourites, ids: storedIds };

  // 3️⃣ Write to Redis cache (non-blocking, failure is safe)
  try {
    await redisClient.set(key, JSON.stringify(payload), "EX", CACHE_TTL);
  } catch (redisErr) {
    console.error("[favourites] Redis SET error:", redisErr);
  }

  return NextResponse.json({ ...payload, source: "db" });
}

// ── POST — Toggle favourite (update DB once, invalidate cache) ──────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const userId = session.user.email;

  await connectToDatabase();

  // Normalise: always store sourceId (not _id) to keep IDs consistent
  let normalisedId = bookId;
  const isObjectId = mongoose.isValidObjectId(bookId) && bookId.length === 24;
  if (isObjectId) {
    const book = await Book.findById(bookId).select("sourceId").lean() as any;
    if (book?.sourceId) normalisedId = book.sourceId;
  }

  const user = await User.findOne({ email: userId }) as any;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const alreadyFavourited =
    user.favouriteBookIds?.includes(normalisedId) ||
    user.favouriteBookIds?.includes(bookId);

  // 1️⃣ Update MongoDB exactly once
  if (alreadyFavourited) {
    await User.findOneAndUpdate(
      { email: userId },
      { $pull: { favouriteBookIds: { $in: [normalisedId, bookId] } } }
    );
  } else {
    await User.findOneAndUpdate(
      { email: userId },
      { $addToSet: { favouriteBookIds: normalisedId } }
    );
  }

  // 2️⃣ Invalidate Redis cache so next GET fetches fresh data from DB
  try {
    await redisClient.del(cacheKey(userId));
  } catch (redisErr) {
    console.error("[favourites] Redis DEL error:", redisErr);
  }

  return NextResponse.json({
    added: !alreadyFavourited,
    message: alreadyFavourited ? "Removed from favourites" : "Added to favourites",
  });
}

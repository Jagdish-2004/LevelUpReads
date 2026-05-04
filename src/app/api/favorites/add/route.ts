export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { Favourite } from "@/backend/models/Favourite";
import { getCachedIds, setCachedIds } from "@/backend/lib/favouriteCache";
import { addFavouriteSyncJob } from "@/backend/lib/queue";
import { createContextLogger } from "@/backend/lib/logger";

const log = createContextLogger("api:favorites:add");

/**
 * POST /api/favorites/add
 * Body: { bookId: string }
 *
 * Write-back strategy:
 *  1. Seed Redis if cache is cold (miss) from MongoDB
 *  2. Add bookId to Redis immediately
 *  3. Return updated list to UI (fast response)
 *  4. Queue BullMQ job to persist to MongoDB (3s delay, deduplicated per user)
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId || typeof bookId !== "string") {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const userId = session.user.email;

  // ── 1. Get current list (cache or DB) ──────────────────────────────────────
  let current = await getCachedIds(userId);

  if (current === null) {
    // Cold start — load from DB to seed the cache
    log.info({ userId }, "Cache MISS on add — seeding from MongoDB");
    await connectToDatabase();
    const doc = await Favourite.findOne({ userId }).lean() as any;
    current = doc?.bookIds ?? [];
    await setCachedIds(userId, current);
  }

  // ── 2. Guard against duplicates ─────────────────────────────────────────────
  if (current.includes(bookId)) {
    return NextResponse.json({
      added: false,
      message: "Already in favourites",
      ids: current,
    });
  }

  // ── 3. Write to Redis immediately (fast path) ────────────────────────────────
  const updated = [...current, bookId];
  await setCachedIds(userId, updated);
  log.info({ userId, bookId }, "Book added to Redis cache");

  // ── 4. Queue async DB sync (write-behind, 3s delay, deduplicated) ───────────
  await addFavouriteSyncJob(userId, updated);

  return NextResponse.json({
    added: true,
    message: "Added to favourites",
    ids: updated,
  });
}

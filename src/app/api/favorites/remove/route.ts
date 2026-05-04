import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { Favourite } from "@/backend/models/Favourite";
import { getCachedIds, setCachedIds } from "@/backend/lib/favouriteCache";
import { addFavouriteSyncJob } from "@/backend/lib/queue";
import { createContextLogger } from "@/backend/lib/logger";

const log = createContextLogger("api:favorites:remove");

/**
 * DELETE /api/favorites/remove
 * Body: { bookId: string }
 *
 * Write-back strategy (same as add, symmetric):
 *  1. Seed Redis from MongoDB if cache is cold
 *  2. Remove bookId from Redis immediately
 *  3. Return to UI instantly
 *  4. Queue BullMQ job to persist removal to MongoDB
 */
export async function DELETE(req: NextRequest) {
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
    log.info({ userId }, "Cache MISS on remove — seeding from MongoDB");
    await connectToDatabase();
    const doc = await Favourite.findOne({ userId }).lean() as any;
    current = doc?.bookIds ?? [];
    await setCachedIds(userId, current);
  }

  if (!current.includes(bookId)) {
    return NextResponse.json({
      removed: false,
      message: "Not in favourites",
      ids: current,
    });
  }

  // ── 2. Remove from Redis immediately ─────────────────────────────────────────
  const updated = current.filter((id) => id !== bookId);
  await setCachedIds(userId, updated);
  log.info({ userId, bookId }, "Book removed from Redis cache");

  // ── 3. Queue async DB sync ───────────────────────────────────────────────────
  await addFavouriteSyncJob(userId, updated);

  return NextResponse.json({
    removed: true,
    message: "Removed from favourites",
    ids: updated,
  });
}

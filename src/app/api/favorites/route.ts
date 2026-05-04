export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { Favourite } from "@/backend/models/Favourite";
import { Book } from "@/backend/models/Book";
import { getCachedIds, setCachedIds } from "@/backend/lib/favouriteCache";
import { createContextLogger } from "@/backend/lib/logger";

const log = createContextLogger("api:favorites:get");

/**
 * GET /api/favorites
 *
 * Cache-first strategy:
 *  1. Check Redis for user's bookIds
 *  2. On hit  → populate books from MongoDB (or return just ids if needed)
 *  3. On miss → load from MongoDB, seed Redis, populate books
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.email;
  let bookIds: string[] | null = null;
  let source = "cache";

  // ── 1. Try Redis ────────────────────────────────────────────────────────────
  bookIds = await getCachedIds(userId);

  // ── 2. Cache miss → fallback to MongoDB ────────────────────────────────────
  if (bookIds === null) {
    source = "db";
    log.info({ userId }, "Cache MISS — reading from MongoDB");
    await connectToDatabase();
    const doc = await Favourite.findOne({ userId }).lean() as any;
    bookIds = doc?.bookIds ?? [];
    // Seed Redis so next call is a cache hit
    await setCachedIds(userId, bookIds!);
  } else {
    log.debug({ userId, count: bookIds.length }, "Cache HIT");
  }

  // ── 3. Populate full book documents ────────────────────────────────────────
  let favourites: any[] = [];
  if (bookIds!.length > 0) {
    await connectToDatabase();
    favourites = await Book.find({ sourceId: { $in: bookIds } }).lean();
  }

  return NextResponse.json({ favourites, ids: bookIds, source });
}

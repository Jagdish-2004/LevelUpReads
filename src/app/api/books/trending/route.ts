import { NextRequest, NextResponse } from "next/server";
import { BookService } from "@/backend/services/bookService";
import { withRateLimit } from "@/backend/middleware/rateLimiter";

async function getHandler(req: NextRequest) {
  try {
    const trendingBooks = await BookService.getTrendingBooks(10);
    return NextResponse.json(trendingBooks);
  } catch (error: any) {
    console.error("Trending API Error:", error);
    return NextResponse.json({ error: "Failed to fetch trending books" }, { status: 500 });
  }
}

export const GET = withRateLimit(getHandler, 5, 1);

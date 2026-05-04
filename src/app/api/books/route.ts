import { NextRequest, NextResponse } from "next/server";
import { BookService } from "@/backend/services/bookService";
import { withRateLimit } from "@/backend/middleware/rateLimiter";

async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const books = await BookService.searchBooks(query, page, limit);
    return NextResponse.json(books);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to search books" }, { status: 500 });
  }
}

// Apply rate limiting (5 requests per second per IP)
export const GET = withRateLimit(getHandler, 5, 1);

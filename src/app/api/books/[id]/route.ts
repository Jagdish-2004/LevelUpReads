import { NextRequest, NextResponse } from "next/server";
import { BookService } from "@/backend/services/bookService";
import { withRateLimit } from "@/backend/middleware/rateLimiter";

async function getHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await BookService.getBookDetails(id);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json(book);
  } catch (error: any) {
    console.error("Get Book API Error:", error);
    return NextResponse.json({ error: "Failed to get book details" }, { status: 500 });
  }
}

export const GET = withRateLimit(getHandler, 5, 1);

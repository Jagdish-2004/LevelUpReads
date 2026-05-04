import { NextRequest, NextResponse } from "next/server";
import { ReviewService } from "@/backend/services/reviewService";
import { withRateLimit } from "@/backend/middleware/rateLimiter";
// In a real app, you would verify the JWT here.
// import { auth } from "@/lib/auth"; 

async function postHandler(req: NextRequest) {
  try {
    // const session = await auth.api.getSession({ headers: req.headers });
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Using mock user for now, assuming auth is separated
    const userId = "mock-user-id";
    const userName = "Mock User";

    const body = await req.json();
    const { bookId, rating, comment } = body;

    if (!bookId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = await ReviewService.addReview(userId, userName, bookId, rating, comment);
    
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Add Review API Error:", error);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, 5, 1);

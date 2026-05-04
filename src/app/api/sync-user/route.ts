export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";
import { headers } from "next/headers";

// Called after login to sync the current session user into our Mongoose User model
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const syncedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $setOnInsert: {
          name: session.user.name,
          email: session.user.email,
          emailVerified: session.user.emailVerified ?? false,
          image: session.user.image ?? "",
          role: "reader",
          xp: 0,
          booksRead: 0,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ success: true, user: syncedUser });
  } catch (error: any) {
    console.error("[sync-user] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    name: (user as any).name,
    email: (user as any).email,
    phone: (user as any).phone || "",
    dob: (user as any).dob || "",
    phoneVerified: (user as any).phoneVerified || false,
    emailVerified: (user as any).emailVerified || false,
    image: (user as any).image || "",
    xp: (user as any).xp || 0,
    booksRead: (user as any).booksRead || 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, dob } = await req.json();

  await connectToDatabase();
  await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: { name, dob } }
  );

  return NextResponse.json({ success: true });
}

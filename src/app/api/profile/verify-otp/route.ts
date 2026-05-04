import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyOtp } from "@/backend/lib/otp";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { type, value, otp } = await req.json();

  if (!type || !value || !otp) {
    return NextResponse.json({ error: "type, value, and otp are required" }, { status: 400 });
  }

  const isValid = await verifyOtp(type, value, otp);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid or expired OTP. Please try again." }, { status: 400 });
  }

  await connectToDatabase();

  if (type === "email") {
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { email: value, emailVerified: true } }
    );
    return NextResponse.json({ success: true, message: "Email updated successfully." });
  }

  if (type === "phone") {
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { phone: value, phoneVerified: true } }
    );
    return NextResponse.json({ success: true, message: "Phone number verified and saved." });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

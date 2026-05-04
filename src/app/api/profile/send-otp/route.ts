import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateOtp, storeOtp, sendEmailOtp, sendPhoneOtp } from "@/backend/lib/otp";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { type, value } = await req.json(); // type: "email" | "phone", value: new email or phone

  if (!type || !value) {
    return NextResponse.json({ error: "type and value are required" }, { status: 400 });
  }

  // Check for duplicate email/phone
  if (type === "email") {
    await connectToDatabase();
    const existing = await User.findOne({ email: value });
    if (existing) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }
  }
  if (type === "phone") {
    await connectToDatabase();
    const existing = await User.findOne({ phone: value });
    if (existing) {
      return NextResponse.json({ error: "This phone number is already in use." }, { status: 409 });
    }
  }

  const otp = generateOtp();
  await storeOtp(type, value, otp);

  try {
    if (type === "email") {
      await sendEmailOtp(value, otp);
    } else {
      await sendPhoneOtp(value, otp);
    }
    return NextResponse.json({ success: true, message: `OTP sent to ${value}` });
  } catch (err: any) {
    console.error("[send-otp] Error:", err.message);
    return NextResponse.json({ error: "Failed to send OTP. Check email/SMS config.", detail: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

// DELETE all seeded dummy users
export async function GET() {
  try {
    await connectToDatabase();

    const dummyEmails = [
      "arjun@example.com",
      "priya@example.com",
      "rahul@example.com",
      "sneha@example.com",
      "vikram@example.com",
      "ananya@example.com",
      "rohan@example.com",
      "kavya@example.com",
      "amit@example.com",
      "divya@example.com",
    ];

    const result = await User.deleteMany({ email: { $in: dummyEmails } });

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.deletedCount} dummy users from the database.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

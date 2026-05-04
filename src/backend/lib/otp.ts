import redisClient from "./redis";
import nodemailer from "nodemailer";

const OTP_TTL = 300; // 5 minutes

/** Generate a 6-digit OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store OTP in Redis with 5-min expiry */
export async function storeOtp(type: "email" | "phone", identifier: string, otp: string): Promise<void> {
  const key = `otp:${type}:${identifier}`;
  await redisClient.set(key, otp, "EX", OTP_TTL);
}

/** Verify OTP from Redis. Returns true and deletes key if valid. */
export async function verifyOtp(type: "email" | "phone", identifier: string, otp: string): Promise<boolean> {
  const key = `otp:${type}:${identifier}`;
  const stored = await redisClient.get(key);
  if (stored === otp) {
    await redisClient.del(key);
    return true;
  }
  return false;
}

/** Send OTP via email using nodemailer */
export async function sendEmailOtp(toEmail: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  await transporter.sendMail({
    from: `"LevelUpReads" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your LevelUpReads Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="margin-bottom: 8px;">📚 LevelUpReads</h2>
        <p style="color: #555;">Your email verification code is:</p>
        <div style="font-size: 40px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 24px 0; color: #111;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

/** Send OTP via SMS (Twilio-ready stub) */
export async function sendPhoneOtp(phone: string, otp: string): Promise<void> {
  // For production: integrate Twilio here
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ body: `Your LevelUpReads code: ${otp}`, from: process.env.TWILIO_PHONE, to: phone });

  // Dev mode: log to console
  console.log(`[DEV] Phone OTP for ${phone}: ${otp}`);
}

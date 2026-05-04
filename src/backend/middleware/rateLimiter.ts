import { NextRequest, NextResponse } from "next/server";
import redisClient from "../lib/redis";

/**
 * Token Bucket Rate Limiter
 * @param req NextRequest
 * @param limit max requests per window
 * @param windowSec time window in seconds
 * @returns boolean indicating if the request is allowed
 */
export async function rateLimit(req: NextRequest, limit: number = 5, windowSec: number = 1): Promise<boolean> {
  // In newer versions of Next.js, req.ip is not available directly on the request object.
  // Instead, rely on reverse proxy headers.
  const ip = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const key = `rate-limit:${ip}`;

  const currentCount = await redisClient.incr(key);

  if (currentCount === 1) {
    // Set expiry on the first request in the window
    await redisClient.expire(key, windowSec);
  }

  if (currentCount > limit) {
    return false; // Rate limit exceeded
  }

  return true; // Allowed
}

export function withRateLimit(handler: Function, limit: number = 5, windowSec: number = 1) {
  return async (req: NextRequest, ...args: any[]) => {
    const isAllowed = await rateLimit(req, limit, windowSec);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
    return handler(req, ...args);
  };
}

import { NextRequest } from "next/server";
import { rateLimit } from "../src/backend/middleware/rateLimiter";
import redisClient from "../src/backend/lib/redis";

// Mock the redis client
jest.mock("../src/backend/lib/redis", () => ({
  __esModule: true,
  default: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

describe("Rate Limiter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow request under limit", async () => {
    (redisClient.incr as jest.Mock).mockResolvedValue(1);
    const req = new NextRequest("http://localhost/api", {
      headers: new Headers({ "x-forwarded-for": "192.168.1.1" }),
    });

    const isAllowed = await rateLimit(req, 5, 10);
    expect(isAllowed).toBe(true);
    expect(redisClient.expire).toHaveBeenCalledWith("rate-limit:192.168.1.1", 10);
  });

  it("should block request over limit", async () => {
    (redisClient.incr as jest.Mock).mockResolvedValue(6);
    const req = new NextRequest("http://localhost/api", {
      headers: new Headers({ "x-forwarded-for": "192.168.1.1" }),
    });

    const isAllowed = await rateLimit(req, 5, 10);
    expect(isAllowed).toBe(false);
  });
});

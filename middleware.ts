import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Ideally verify session with backend, but for middleware speed we check presence
  // For strict role checks, fetch user session in server component or use a verified JWT approach.
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/reader/dashboard/:path*", "/curator/dashboard/:path*"],
};

import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, login page, and API routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/login" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If Firebase Admin credentials are not configured in local environment, allow pass-through
  // but if session is present, allow always
  const session = request.cookies.get("admin_session")?.value;

  // Only redirect to login if session is completely missing in an environment that enforces auth
  if (!session && process.env.NODE_ENV === "production") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

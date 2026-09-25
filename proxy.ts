import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Next.js 16 renamed Middleware to Proxy — see node_modules/next/dist/docs/
// app/getting-started/proxy.md. Functionality is the same; this file is
// what protects everything under /admin plus the content-write API routes.

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/content/update", "/api/upload"],
};

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Admin-only API paths — cookie presence checked here, role checked server-side
const ADMIN_ONLY_PATHS = [
  "/api/user/activateAdmin",
  "/api/user/deactivateAdmin",
  "/api/user/activate",
  "/api/user/deactivate",
  "/api/user/inviteuser",
  "/api/admin",
];

function hasValidSessionCookie(req: NextRequest): boolean {
  // Check for local dev bypass
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  ) {
    return true;
  }

  // Check for Supabase Auth session cookies (e.g. sb-<project>-auth-token)
  return req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Inngest webhook — pass through, Inngest handles its own auth via signing key
  if (path.startsWith("/api/inngest")) {
    return NextResponse.next();
  }

  // Auth / public API routes — pass through
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const hasSession = hasValidSessionCookie(req);

  // Admin-only routes — require session cookie (role checked server-side)
  if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Non-API routes — redirect to sign-in if no session cookie
  if (!path.startsWith("/api")) {
    if (!hasSession) {
      const authPaths = [
        "/sign-in",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/pending",
        "/inactive",
      ];
      const isAuthPage = authPaths.some((p) => path.includes(p));
      if (!isAuthPage) {
        return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
      }
    }
  }

  // Non-API routes — delegate to next-intl
  return intlMiddleware(req);
}

export default proxy;

export const config = {
  matcher: [
    // Admin-only API paths
    "/api/user/activateAdmin/:path*",
    "/api/user/deactivateAdmin/:path*",
    "/api/user/activate/:path*",
    "/api/user/deactivate/:path*",
    "/api/user/inviteuser",
    "/api/admin/:path*",
    // Auth API paths
    "/api/auth/:path*",
    // All non-API routes (existing intl matcher)
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};

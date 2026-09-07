import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = new Set([
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
]);

const DEFAULT_AFTER_LOGIN = "/";

const STATIC_FILE_REGEX =
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|mjs|woff2?|ttf|txt|xml|json|map)$/;

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    STATIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  const normalized =
    pathname.length > 1
      ? pathname.replace(/\/+$/, "")
      : pathname;

  const sessionCookie = getSessionCookie(request);

  // Logged-in user visiting an auth page
  if (sessionCookie && publicRoutes.has(normalized)) {
    const callback = searchParams.get("callbackUrl");

    const target =
      callback &&
      callback.startsWith("/") &&
      !callback.startsWith("//")
        ? callback
        : DEFAULT_AFTER_LOGIN;

    return NextResponse.redirect(
      new URL(target, request.url)
    );
  }

  // Public authentication pages
  if (publicRoutes.has(normalized)) {
    return NextResponse.next();
  }

  // Everything else requires authentication
  if (!sessionCookie) {
    // Protected API request
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Protected page
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname + request.nextUrl.search
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|api/webhooks).*)"],
};
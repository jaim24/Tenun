import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/threads/callback",
  "/api/health",
  "/api/cron/",
];

function isPublicApi(req: NextRequest): boolean {
  return PUBLIC_API_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api");

  if (isApi) {
    if (isPublicApi(req)) return NextResponse.next();
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySessionToken(token))) return NextResponse.next();
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/app")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySessionToken(token))) return NextResponse.next();
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const authed = token ? await verifySessionToken(token) : false;
    return NextResponse.redirect(new URL(authed ? "/app" : "/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|logo\\.svg).*)"],
};
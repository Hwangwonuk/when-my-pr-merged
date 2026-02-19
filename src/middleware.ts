import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 세션 쿠키 존재 여부로 간단한 인증 체크
  // (iron-session 자체는 서버에서만 복호화 가능하므로 쿠키 존재 여부만 확인)
  const sessionCookie = req.cookies.get("wpmm-session");

  // 보호 대상 경로: 대시보드, 프로필, API(auth/webhook/cron/og 제외)
  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/profile") ||
    /^\/[^/]+\/(stats|reviewers|insights|leaderboard|reports|settings)/.test(pathname) ||
    /^\/[^/]+$/.test(pathname);

  const isProtectedApi =
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/installations");

  if ((isProtectedPage || isProtectedApi) && !sessionCookie) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 보호 대상에서 제외:
     * - /login, /api/auth, /api/webhooks, /api/cron, /api/og, /api/slack
     * - _next (static files), favicon, public assets
     */
    "/((?!login|api/auth|api/webhooks|api/cron|api/og|api/slack|share|_next|favicon|.*\\.).*)",
  ],
};

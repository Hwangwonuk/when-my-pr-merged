import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("wpmm-session");

  let user = null;
  let sessionError = null;
  try {
    user = await getCurrentUser();
  } catch (e: unknown) {
    sessionError = e instanceof Error ? e.message : String(e);
  }

  let dbStatus = "unknown";
  let dbError = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e: unknown) {
    dbStatus = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "(not set)",
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? "set" : "(not set)",
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
        ? "set"
        : "(not set)",
      SESSION_SECRET: process.env.SESSION_SECRET ? "set" : "(not set)",
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "(not set)",
      GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG ?? "(not set)",
    },
    session: {
      cookieExists: !!sessionCookie,
      cookieLength: sessionCookie?.value?.length ?? 0,
      user: user
        ? { userId: user.userId, login: user.login }
        : null,
      error: sessionError,
    },
    database: {
      status: dbStatus,
      error: dbError,
    },
  });
}

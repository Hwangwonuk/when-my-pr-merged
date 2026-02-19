import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("wpmm-session");
  const checkSlug = req.nextUrl.searchParams.get("slug");

  let user = null;
  let sessionError = null;
  try {
    user = await getCurrentUser();
  } catch (e: unknown) {
    sessionError = e instanceof Error ? e.message : String(e);
  }

  let dbStatus = "unknown";
  let dbError = null;
  let installations: { id: string; accountLogin: string; accountType: string; githubInstallId: number }[] = [];
  let members: { id: string; userId: string; installationId: string }[] = [];
  let slugLookup = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";

    installations = await prisma.installation.findMany({
      select: {
        id: true,
        accountLogin: true,
        accountType: true,
        githubInstallId: true,
      },
    });

    if (user) {
      members = await prisma.member.findMany({
        where: { userId: user.userId },
        select: { id: true, userId: true, installationId: true },
      });
    }

    if (checkSlug) {
      slugLookup = await prisma.installation.findFirst({
        where: { accountLogin: checkSlug },
        select: { id: true, accountLogin: true, accountType: true },
      });
    }
  } catch (e: unknown) {
    dbStatus = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    session: {
      cookieExists: !!sessionCookie,
      user: user ? { userId: user.userId, login: user.login } : null,
      error: sessionError,
    },
    database: {
      status: dbStatus,
      error: dbError,
      installations,
      members,
      slugLookup: checkSlug ? { query: checkSlug, result: slugLookup } : undefined,
    },
  });
}

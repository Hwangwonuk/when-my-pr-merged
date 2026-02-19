import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", req.url));
  }

  const accessToken = tokenData.access_token;

  // Fetch user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const ghUser = await userRes.json();

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { githubId: ghUser.id },
    update: {
      login: ghUser.login,
      name: ghUser.name,
      avatarUrl: ghUser.avatar_url,
      email: ghUser.email,
    },
    create: {
      githubId: ghUser.id,
      login: ghUser.login,
      name: ghUser.name,
      avatarUrl: ghUser.avatar_url,
      email: ghUser.email,
    },
  });

  // Create session
  const session = await getSession();
  session.userId = user.id;
  session.githubId = user.githubId;
  session.login = user.login;
  session.avatarUrl = user.avatarUrl ?? undefined;
  session.accessToken = accessToken;
  await session.save();

  // 대시보드 루트로 리다이렉트 (org 선택/자동 리다이렉트 처리)
  return NextResponse.redirect(new URL("/", req.url));
}

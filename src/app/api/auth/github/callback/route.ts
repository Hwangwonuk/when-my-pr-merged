import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", baseUrl));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
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
      }
    );

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[OAuth] Token exchange error:", tokenData.error);
      return NextResponse.redirect(
        new URL("/login?error=token_exchange", baseUrl)
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ghUser = await userRes.json();

    if (!ghUser.id) {
      console.error("[OAuth] Failed to fetch GitHub user:", ghUser);
      return NextResponse.redirect(
        new URL("/login?error=user_fetch", baseUrl)
      );
    }

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

    // Create session and set cookie on redirect response
    const session = await getSession();
    session.userId = user.id;
    session.githubId = Number(user.githubId);
    session.login = user.login;
    session.avatarUrl = user.avatarUrl ?? undefined;
    session.accessToken = accessToken;
    await session.save();

    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (error) {
    console.error("[OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server_error", baseUrl)
    );
  }
}

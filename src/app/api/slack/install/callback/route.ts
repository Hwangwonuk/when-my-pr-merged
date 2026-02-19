import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const installationId = req.nextUrl.searchParams.get("state");

  if (!code || !installationId) {
    return NextResponse.redirect(new URL("/login?error=slack_install", req.url));
  }

  // Exchange code for bot token
  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/install/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.ok) {
    console.error("Slack OAuth error:", tokenData.error);
    return NextResponse.redirect(new URL("/login?error=slack_token", req.url));
  }

  // Save Slack integration
  await prisma.slackIntegration.upsert({
    where: { installationId },
    update: {
      teamId: tokenData.team.id,
      teamName: tokenData.team.name,
      botToken: tokenData.access_token,
    },
    create: {
      installationId,
      teamId: tokenData.team.id,
      teamName: tokenData.team.name,
      botToken: tokenData.access_token,
    },
  });

  // Redirect back to settings
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  return NextResponse.redirect(
    new URL(`/${installation?.accountLogin ?? ""}/settings`, req.url)
  );
}

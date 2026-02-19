import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installationId = req.nextUrl.searchParams.get("installationId");
  if (!installationId) {
    return NextResponse.json({ error: "Missing installationId" }, { status: 400 });
  }

  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });

  if (!slack) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  // Fetch public channels from Slack
  const res = await fetch("https://slack.com/api/conversations.list?types=public_channel&limit=200", {
    headers: { Authorization: `Bearer ${slack.botToken}` },
  });

  const data = await res.json();
  if (!data.ok) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  const channels = data.channels.map((ch: { id: string; name: string }) => ({
    id: ch.id,
    name: ch.name,
  }));

  return NextResponse.json({
    channels,
    currentChannelId: slack.channelId,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { installationId, channelId, channelName } = body;

  if (!installationId || !channelId || !channelName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });

  if (!slack) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  // Join the channel so bot can post messages
  await fetch("https://slack.com/api/conversations.join", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slack.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId }),
  });

  await prisma.slackIntegration.update({
    where: { installationId },
    data: { channelId, channelName },
  });

  return NextResponse.json({ ok: true });
}

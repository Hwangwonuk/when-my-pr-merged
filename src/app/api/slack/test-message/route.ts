import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getSlackClient } from "@/lib/slack/app";
import { slackMessages } from "@/lib/slack/messages";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { installationId } = body;

  if (!installationId) {
    return NextResponse.json({ error: "Missing installationId" }, { status: 400 });
  }

  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });

  if (!slack) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  if (!slack.channelId || !slack.channelName) {
    return NextResponse.json({ error: "Channel not configured" }, { status: 400 });
  }

  try {
    const client = getSlackClient(slack.botToken);
    const message = slackMessages.testMessage(slack.channelName);

    await client.conversations.join({ channel: slack.channelId });

    const result = await client.chat.postMessage({
      channel: slack.channelId,
      blocks: message.blocks,
      text: "When My PR Merged 연동 테스트 메시지",
    });

    if (!result.ok) {
      console.error("[test-message] Slack API error:", result.error);
      return NextResponse.json({ error: result.error ?? "Slack API error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[test-message] Failed to send:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

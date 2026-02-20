import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSlackClient } from "@/lib/slack/app";
import { formatDuration } from "@/lib/utils/format";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yesterday = subDays(now, 1);

  const integrations = await prisma.slackIntegration.findMany({
    where: { channelId: { not: null }, dailyDigestEnabled: true },
    include: { installation: true },
  });

  let digestsSent = 0;

  for (const integration of integrations) {
    if (!integration.channelId) continue;

    // Get yesterday's activity
    const [opened, merged, reviewed] = await Promise.all([
      prisma.pullRequest.count({
        where: {
          repository: { installationId: integration.installationId },
          createdAt: { gte: yesterday, lte: now },
        },
      }),
      prisma.pullRequest.count({
        where: {
          repository: { installationId: integration.installationId },
          mergedAt: { gte: yesterday, lte: now },
          state: "merged",
        },
      }),
      prisma.review.count({
        where: {
          pullRequest: {
            repository: { installationId: integration.installationId },
          },
          submittedAt: { gte: yesterday, lte: now },
        },
      }),
    ]);

    // Get pending reviews
    const pendingReviews = await prisma.pullRequest.count({
      where: {
        repository: { installationId: integration.installationId },
        state: "open",
        draft: false,
        firstReviewAt: null,
      },
    });

    if (opened === 0 && merged === 0 && reviewed === 0) continue;

    const client = getSlackClient(integration.botToken);
    await client.chat.postMessage({
      channel: integration.channelId,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:sunrise: ${integration.installation.accountLogin} 일일 PR 요약`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*새 PR*\n${opened}개` },
            { type: "mrkdwn", text: `*머지된 PR*\n${merged}개` },
            { type: "mrkdwn", text: `*리뷰 완료*\n${reviewed}건` },
            { type: "mrkdwn", text: `*리뷰 대기*\n${pendingReviews}개` },
          ],
        },
      ],
    });
    digestsSent++;
  }

  return NextResponse.json({ digestsSent });
}

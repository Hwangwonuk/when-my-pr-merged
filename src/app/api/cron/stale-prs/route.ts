import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStalePrAlert, sendApprovedButUnmergedAlert } from "@/lib/slack/notifications";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all installations with Slack integration and stale PR alerts enabled
  const integrations = await prisma.slackIntegration.findMany({
    where: { stalePrAlertEnabled: true },
    include: { installation: true },
  });

  let alertsSent = 0;

  for (const integration of integrations) {
    const thresholdMs = integration.stalePrThresholdHours * 60 * 60 * 1000;
    const thresholdDate = new Date(Date.now() - thresholdMs);

    // Find open PRs with no reviews past the threshold
    const stalePRs = await prisma.pullRequest.findMany({
      where: {
        repository: { installationId: integration.installationId },
        state: "open",
        draft: false,
        firstReviewAt: null,
        createdAt: { lte: thresholdDate },
      },
      include: {
        author: { select: { login: true } },
        repository: { select: { fullName: true } },
      },
    });

    for (const pr of stalePRs) {
      const hoursStale = Math.floor(
        (Date.now() - pr.createdAt.getTime()) / (60 * 60 * 1000)
      );

      await sendStalePrAlert(integration, {
        title: pr.title,
        number: pr.number,
        url: `https://github.com/${pr.repository.fullName}/pull/${pr.number}`,
        hours: hoursStale,
        author: pr.author.login,
      });
      alertsSent++;
    }

    // 승인되었지만 48시간 이상 미머지된 PR 알림
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const approvedButUnmerged = await prisma.pullRequest.findMany({
      where: {
        repository: { installationId: integration.installationId },
        state: "open",
        draft: false,
        firstApprovalAt: { not: null, lte: fortyEightHoursAgo },
      },
      include: {
        author: { select: { login: true } },
        repository: { select: { fullName: true } },
      },
    });

    for (const pr of approvedButUnmerged) {
      const hoursSinceApproval = Math.floor(
        (Date.now() - pr.firstApprovalAt!.getTime()) / (60 * 60 * 1000)
      );

      await sendApprovedButUnmergedAlert(integration, {
        title: pr.title,
        number: pr.number,
        url: `https://github.com/${pr.repository.fullName}/pull/${pr.number}`,
        hours: hoursSinceApproval,
        author: pr.author.login,
      });
      alertsSent++;
    }
  }

  return NextResponse.json({ alertsSent });
}

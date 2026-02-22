import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStalePrAlert, sendApprovedButUnmergedAlert, sendReviewedButStaleAlert } from "@/lib/slack/notifications";

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

    // 리뷰(코멘트/변경요청)되었지만 24시간 이상 방치된 PR 알림
    // 승인된 PR은 아래 approvedButUnmerged에서 별도 처리하므로 제외
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const reviewedButStale = await prisma.pullRequest.findMany({
      where: {
        repository: { installationId: integration.installationId },
        state: "open",
        draft: false,
        firstReviewAt: { not: null, lte: twentyFourHoursAgo },
        firstApprovalAt: null, // 승인된 건 제외 (중복 방지)
      },
      include: {
        author: { select: { login: true } },
        repository: { select: { fullName: true } },
        reviews: {
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: { state: true },
        },
      },
    });

    const reviewStateLabels: Record<string, string> = {
      CHANGES_REQUESTED: "변경 요청",
      COMMENTED: "코멘트",
      DISMISSED: "기각됨",
    };

    for (const pr of reviewedButStale) {
      const hoursSinceReview = Math.floor(
        (Date.now() - pr.firstReviewAt!.getTime()) / (60 * 60 * 1000)
      );
      const latestState = pr.reviews[0]?.state ?? "COMMENTED";
      const stateLabel = reviewStateLabels[latestState] ?? "리뷰됨";

      await sendReviewedButStaleAlert(integration, {
        title: pr.title,
        number: pr.number,
        url: `https://github.com/${pr.repository.fullName}/pull/${pr.number}`,
        hours: hoursSinceReview,
        author: pr.author.login,
        reviewState: stateLabel,
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

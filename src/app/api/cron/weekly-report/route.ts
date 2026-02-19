import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOverviewStats } from "@/lib/stats/calculator";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { sendWeeklyReport } from "@/lib/slack/notifications";
import { formatDuration } from "@/lib/utils/format";
import { format, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const period = `${format(weekAgo, "MM/dd")} - ${format(now, "MM/dd")}`;

  const integrations = await prisma.slackIntegration.findMany({
    where: { weeklyReportEnabled: true },
    include: { installation: true },
  });

  let reportsSent = 0;

  for (const integration of integrations) {
    const params = {
      installationId: integration.installationId,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    };

    const [overview, reviewers] = await Promise.all([
      getOverviewStats(params),
      getReviewerRankings({ ...params, limit: 1 }),
    ]);

    if (overview.totalPRs === 0) continue;

    const topReviewer = reviewers[0];

    await sendWeeklyReport(integration, {
      orgName: integration.installation.accountLogin,
      totalPRs: overview.totalPRs,
      mergedPRs: overview.mergedPRs,
      avgMergeTime: formatDuration(overview.avgTimeToMergeMs),
      avgFirstReviewTime: formatDuration(overview.avgTimeToFirstReviewMs),
      topReviewer: topReviewer?.user.login ?? "N/A",
      topReviewerCount: topReviewer?.reviewCount ?? 0,
      period,
    });
    reportsSent++;
  }

  return NextResponse.json({ reportsSent });
}

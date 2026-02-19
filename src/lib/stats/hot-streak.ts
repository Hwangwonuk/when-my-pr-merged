import { prisma } from "@/lib/prisma";
import { HOT_STREAK_COUNT, HOT_STREAK_THRESHOLD_MS } from "@/lib/utils/constants";
import { sendHotStreakAlert } from "@/lib/slack/notifications";

export async function checkHotStreak(authorId: string, installationId: string) {
  // Get last N merged PRs for this author
  const recentPRs = await prisma.pullRequest.findMany({
    where: {
      authorId,
      state: "merged",
      timeToMergeMs: { not: null },
    },
    orderBy: { mergedAt: "desc" },
    take: HOT_STREAK_COUNT,
  });

  if (recentPRs.length < HOT_STREAK_COUNT) return;

  const allFast = recentPRs.every(
    (pr) => pr.timeToMergeMs !== null && pr.timeToMergeMs <= BigInt(HOT_STREAK_THRESHOLD_MS)
  );

  if (!allFast) return;

  // Send hot streak alert
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
    include: { slackIntegration: true },
  });

  if (!installation?.slackIntegration?.hotStreakAlertEnabled) return;

  const author = await prisma.user.findUnique({ where: { id: authorId } });
  if (!author) return;

  await sendHotStreakAlert(
    installation.slackIntegration,
    author.login,
    HOT_STREAK_COUNT
  );
}

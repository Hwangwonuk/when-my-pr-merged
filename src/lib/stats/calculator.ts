import { prisma } from "@/lib/prisma";
import type { OverviewStats, DateRangeParams } from "@/types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function getOverviewStats(params: DateRangeParams): Promise<OverviewStats> {
  const { from, to, installationId, repositoryId } = params;

  const where = {
    repository: {
      installationId,
      ...(repositoryId ? { id: repositoryId } : {}),
    },
    createdAt: {
      gte: new Date(from),
      lte: new Date(to),
    },
  };

  const [totalPRs, mergedPRs, openPRs] = await Promise.all([
    prisma.pullRequest.count({ where }),
    prisma.pullRequest.count({ where: { ...where, state: "merged" } }),
    prisma.pullRequest.count({ where: { ...where, state: "open" } }),
  ]);

  const mergedPRsWithMetrics = await prisma.pullRequest.findMany({
    where: { ...where, state: "merged", timeToMergeMs: { not: null } },
    select: {
      timeToMergeMs: true,
      timeToFirstReviewMs: true,
      revisionCount: true,
    },
  });

  const mergeTimes = mergedPRsWithMetrics
    .filter((pr) => pr.timeToMergeMs !== null)
    .map((pr) => Number(pr.timeToMergeMs));

  const firstReviewTimes = mergedPRsWithMetrics
    .filter((pr) => pr.timeToFirstReviewMs !== null)
    .map((pr) => Number(pr.timeToFirstReviewMs));

  const revisionCounts = mergedPRsWithMetrics.map((pr) => pr.revisionCount);

  const avgTimeToMergeMs =
    mergeTimes.length > 0
      ? mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length
      : 0;

  const avgTimeToFirstReviewMs =
    firstReviewTimes.length > 0
      ? firstReviewTimes.reduce((a, b) => a + b, 0) / firstReviewTimes.length
      : 0;

  const avgRevisionCount =
    revisionCounts.length > 0
      ? revisionCounts.reduce((a, b) => a + b, 0) / revisionCounts.length
      : 0;

  // Compute trend vs previous period
  const periodMs = new Date(to).getTime() - new Date(from).getTime();
  const prevFrom = new Date(new Date(from).getTime() - periodMs).toISOString();
  const prevTo = from;

  const prevMergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      createdAt: { gte: new Date(prevFrom), lte: new Date(prevTo) },
      state: "merged",
      timeToMergeMs: { not: null },
    },
    select: { timeToMergeMs: true, timeToFirstReviewMs: true },
  });

  const prevMergeTimes = prevMergedPRs
    .filter((pr) => pr.timeToMergeMs !== null)
    .map((pr) => Number(pr.timeToMergeMs));
  const prevFirstReviewTimes = prevMergedPRs
    .filter((pr) => pr.timeToFirstReviewMs !== null)
    .map((pr) => Number(pr.timeToFirstReviewMs));

  const prevAvgMerge =
    prevMergeTimes.length > 0
      ? prevMergeTimes.reduce((a, b) => a + b, 0) / prevMergeTimes.length
      : 0;
  const prevAvgFirstReview =
    prevFirstReviewTimes.length > 0
      ? prevFirstReviewTimes.reduce((a, b) => a + b, 0) / prevFirstReviewTimes.length
      : 0;

  const trendMerge =
    prevAvgMerge > 0 ? ((avgTimeToMergeMs - prevAvgMerge) / prevAvgMerge) * 100 : 0;
  const trendFirstReview =
    prevAvgFirstReview > 0
      ? ((avgTimeToFirstReviewMs - prevAvgFirstReview) / prevAvgFirstReview) * 100
      : 0;

  return {
    totalPRs,
    mergedPRs,
    openPRs,
    avgTimeToFirstReviewMs,
    avgTimeToMergeMs,
    medianTimeToMergeMs: median(mergeTimes),
    avgRevisionCount,
    mergeRate: totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0,
    trend: {
      timeToMerge: trendMerge,
      timeToFirstReview: trendFirstReview,
    },
  };
}

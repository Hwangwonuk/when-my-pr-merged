import { prisma } from "@/lib/prisma";
import { getDayNameKo, getPrSizeLabel, getPrSizeBucket } from "@/lib/utils/format";
import type {
  HourlyPattern,
  DailyPattern,
  SizeAnalysis,
  BottleneckAnalysis,
  DateRangeParams,
} from "@/types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function getHourlyPatterns(params: DateRangeParams): Promise<HourlyPattern[]> {
  const { from, to, installationId, repositoryId } = params;

  const mergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      mergedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
      state: "merged",
      timeToMergeMs: { not: null },
    },
    select: { mergedAt: true, timeToMergeMs: true, createdAt: true },
  });

  // Group by hour of PR creation (when was the PR created that led to fast/slow merge)
  const hourlyBuckets = new Map<number, number[]>();
  for (let h = 0; h < 24; h++) hourlyBuckets.set(h, []);

  for (const pr of mergedPRs) {
    const hour = pr.createdAt.getHours();
    hourlyBuckets.get(hour)!.push(Number(pr.timeToMergeMs));
  }

  return Array.from(hourlyBuckets.entries()).map(([hour, times]) => ({
    hour,
    avgMergeTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    prCount: times.length,
  }));
}

export async function getDailyPatterns(params: DateRangeParams): Promise<DailyPattern[]> {
  const { from, to, installationId, repositoryId } = params;

  const mergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      mergedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
      state: "merged",
      timeToMergeMs: { not: null },
    },
    select: { createdAt: true, timeToMergeMs: true },
  });

  const dailyBuckets = new Map<number, number[]>();
  for (let d = 0; d < 7; d++) dailyBuckets.set(d, []);

  for (const pr of mergedPRs) {
    const day = pr.createdAt.getDay();
    dailyBuckets.get(day)!.push(Number(pr.timeToMergeMs));
  }

  return Array.from(dailyBuckets.entries()).map(([dayOfWeek, times]) => ({
    dayOfWeek,
    dayName: getDayNameKo(dayOfWeek),
    avgMergeTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    prCount: times.length,
  }));
}

export async function getSizeAnalysis(params: DateRangeParams): Promise<SizeAnalysis[]> {
  const { from, to, installationId, repositoryId } = params;

  const mergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      mergedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
      state: "merged",
      timeToMergeMs: { not: null },
    },
    select: { additions: true, deletions: true, timeToMergeMs: true },
  });

  const buckets: Record<string, number[]> = { S: [], M: [], L: [], XL: [] };

  for (const pr of mergedPRs) {
    const bucket = getPrSizeBucket(pr.additions, pr.deletions);
    buckets[bucket].push(Number(pr.timeToMergeMs));
  }

  return (["S", "M", "L", "XL"] as const).map((bucket) => ({
    bucket,
    label: getPrSizeLabel(
      bucket === "S" ? 50 : bucket === "M" ? 200 : bucket === "L" ? 400 : 600,
      0
    ),
    avgMergeTimeMs:
      buckets[bucket].length > 0
        ? buckets[bucket].reduce((a, b) => a + b, 0) / buckets[bucket].length
        : 0,
    medianMergeTimeMs: median(buckets[bucket]),
    prCount: buckets[bucket].length,
  }));
}

export async function getBottleneckAnalysis(params: DateRangeParams): Promise<BottleneckAnalysis> {
  const { from, to, installationId, repositoryId } = params;

  const mergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      mergedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
      state: "merged",
      timeToFirstReviewMs: { not: null },
    },
    select: {
      createdAt: true,
      firstReviewAt: true,
      firstApprovalAt: true,
      mergedAt: true,
      timeToFirstReviewMs: true,
      timeToMergeMs: true,
    },
  });

  const timeToFirstReviews: number[] = [];
  const firstReviewToApprovals: number[] = [];
  const approvalToMerges: number[] = [];

  for (const pr of mergedPRs) {
    if (pr.timeToFirstReviewMs) {
      timeToFirstReviews.push(Number(pr.timeToFirstReviewMs));
    }

    if (pr.firstReviewAt && pr.firstApprovalAt) {
      firstReviewToApprovals.push(
        pr.firstApprovalAt.getTime() - pr.firstReviewAt.getTime()
      );
    }

    if (pr.firstApprovalAt && pr.mergedAt) {
      approvalToMerges.push(pr.mergedAt.getTime() - pr.firstApprovalAt.getTime());
    }
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const avgTimeToFirstReviewMs = avg(timeToFirstReviews);
  const avgFirstReviewToApprovalMs = avg(firstReviewToApprovals);
  const avgApprovalToMergeMs = avg(approvalToMerges);

  return {
    avgTimeToFirstReviewMs,
    avgFirstReviewToApprovalMs,
    avgApprovalToMergeMs,
    avgTotalMs: avgTimeToFirstReviewMs + avgFirstReviewToApprovalMs + avgApprovalToMergeMs,
  };
}

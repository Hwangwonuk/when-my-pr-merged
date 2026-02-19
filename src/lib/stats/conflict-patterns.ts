import { prisma } from "@/lib/prisma";
import { getDayNameKo, getPrSizeBucket } from "@/lib/utils/format";
import type { ConflictPatternAnalysis, DateRangeParams } from "@/types";

export async function getConflictPatterns(
  params: DateRangeParams
): Promise<ConflictPatternAnalysis> {
  const { from, to, installationId, repositoryId } = params;

  const prs = await prisma.pullRequest.findMany({
    where: {
      repository: {
        installationId,
        ...(repositoryId ? { id: repositoryId } : {}),
      },
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    select: {
      createdAt: true,
      additions: true,
      deletions: true,
      hasConflict: true,
      conflictDetectedAt: true,
      conflictResolvedAt: true,
    },
  });

  const totalPRs = prs.length;
  const conflictPRs = prs.filter((pr) => pr.hasConflict).length;
  const conflictRate = totalPRs > 0 ? conflictPRs / totalPRs : 0;

  // Average resolution time
  const resolutionTimes: number[] = [];
  for (const pr of prs) {
    if (pr.conflictDetectedAt && pr.conflictResolvedAt) {
      resolutionTimes.push(
        pr.conflictResolvedAt.getTime() - pr.conflictDetectedAt.getTime()
      );
    }
  }
  const avgResolutionTimeMs =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

  // By day of week
  const dayBuckets = new Map<number, { conflict: number; total: number }>();
  for (let d = 0; d < 7; d++) dayBuckets.set(d, { conflict: 0, total: 0 });

  for (const pr of prs) {
    const day = pr.createdAt.getDay();
    const bucket = dayBuckets.get(day)!;
    bucket.total++;
    if (pr.hasConflict) bucket.conflict++;
  }

  const byDay = Array.from(dayBuckets.entries()).map(([dayOfWeek, data]) => ({
    dayOfWeek,
    dayName: getDayNameKo(dayOfWeek),
    conflictRate: data.total > 0 ? data.conflict / data.total : 0,
    conflictCount: data.conflict,
    totalCount: data.total,
  }));

  // By hour
  const hourBuckets = new Map<number, { conflict: number; total: number }>();
  for (let h = 0; h < 24; h++) hourBuckets.set(h, { conflict: 0, total: 0 });

  for (const pr of prs) {
    const hour = pr.createdAt.getHours();
    const bucket = hourBuckets.get(hour)!;
    bucket.total++;
    if (pr.hasConflict) bucket.conflict++;
  }

  const byHour = Array.from(hourBuckets.entries()).map(([hour, data]) => ({
    hour,
    conflictRate: data.total > 0 ? data.conflict / data.total : 0,
    conflictCount: data.conflict,
    totalCount: data.total,
  }));

  // By PR size
  const sizeBuckets: Record<string, { conflict: number; total: number }> = {
    S: { conflict: 0, total: 0 },
    M: { conflict: 0, total: 0 },
    L: { conflict: 0, total: 0 },
    XL: { conflict: 0, total: 0 },
  };

  for (const pr of prs) {
    const bucket = getPrSizeBucket(pr.additions, pr.deletions);
    sizeBuckets[bucket].total++;
    if (pr.hasConflict) sizeBuckets[bucket].conflict++;
  }

  const bySize = (["S", "M", "L", "XL"] as const).map((bucket) => ({
    bucket,
    conflictRate:
      sizeBuckets[bucket].total > 0
        ? sizeBuckets[bucket].conflict / sizeBuckets[bucket].total
        : 0,
    conflictCount: sizeBuckets[bucket].conflict,
    totalCount: sizeBuckets[bucket].total,
  }));

  return {
    totalPRs,
    conflictPRs,
    conflictRate,
    avgResolutionTimeMs,
    byDay,
    byHour,
    bySize,
  };
}

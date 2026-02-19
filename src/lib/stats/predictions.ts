import { prisma } from "@/lib/prisma";
import { subDays, addMilliseconds, getDay, getHours } from "date-fns";
import type { MergePrediction } from "@/types";

interface PredictionParams {
  prId: string;
  installationId: string;
}

/**
 * 머지 예측 모델
 *
 * 가중치:
 * - 작성자 히스토리 (40%): 해당 작성자의 과거 PR 평균 머지 시간
 * - 리뷰어 작업량 (20%): 현재 미완료 리뷰 요청 수 기반 지연 추정
 * - PR 크기 (20%): additions+deletions 기반 크기 구간별 평균 머지 시간
 * - 요일/시간 (20%): 해당 시간대/요일의 평균 머지 시간
 */
export async function getMergePrediction(
  params: PredictionParams
): Promise<MergePrediction | null> {
  const { prId, installationId } = params;

  const pr = await prisma.pullRequest.findUnique({
    where: { id: prId },
    include: {
      repository: true,
      reviewRequests: {
        where: { fulfilledAt: null },
        select: { reviewerId: true },
      },
    },
  });

  if (!pr || pr.state !== "open") return null;

  const now = new Date();
  const ninetyDaysAgo = subDays(now, 90);
  const createdAt = pr.createdAt;
  const dayOfWeek = getDay(createdAt);
  const hourOfDay = getHours(createdAt);
  const prSize = pr.additions + pr.deletions;

  // 1. 작성자 히스토리 (40%)
  const authorMergedPRs = await prisma.pullRequest.findMany({
    where: {
      authorId: pr.authorId,
      state: "merged",
      mergedAt: { gte: ninetyDaysAgo },
      timeToMergeMs: { not: null },
    },
    select: { timeToMergeMs: true },
    take: 50,
    orderBy: { mergedAt: "desc" },
  });

  const authorMergeTimes = authorMergedPRs.map((p) => Number(p.timeToMergeMs));
  const authorAvg =
    authorMergeTimes.length > 0
      ? authorMergeTimes.reduce((a, b) => a + b, 0) / authorMergeTimes.length
      : null;

  // 2. PR 크기별 평균 (20%)
  const sizeBucket = getSizeBucketRange(prSize);
  const sizePRs = await prisma.pullRequest.findMany({
    where: {
      repository: { installationId },
      state: "merged",
      mergedAt: { gte: ninetyDaysAgo },
      timeToMergeMs: { not: null },
      additions: { gte: 0 },
    },
    select: { additions: true, deletions: true, timeToMergeMs: true },
  });

  const sizeFilteredTimes = sizePRs
    .filter((p) => {
      const s = p.additions + p.deletions;
      return s >= sizeBucket.min && s <= sizeBucket.max;
    })
    .map((p) => Number(p.timeToMergeMs));

  const sizeAvg =
    sizeFilteredTimes.length > 0
      ? sizeFilteredTimes.reduce((a, b) => a + b, 0) / sizeFilteredTimes.length
      : null;

  // 3. 요일/시간 평균 (20%)
  const timePRs = await prisma.pullRequest.findMany({
    where: {
      repository: { installationId },
      state: "merged",
      mergedAt: { gte: ninetyDaysAgo },
      timeToMergeMs: { not: null },
    },
    select: { createdAt: true, timeToMergeMs: true },
  });

  const timeFiltered = timePRs.filter((p) => {
    const d = getDay(p.createdAt);
    const h = getHours(p.createdAt);
    return d === dayOfWeek && Math.abs(h - hourOfDay) <= 2;
  });

  const timeAvg =
    timeFiltered.length > 0
      ? timeFiltered.map((p) => Number(p.timeToMergeMs)).reduce((a, b) => a + b, 0) /
        timeFiltered.length
      : null;

  // 4. 리뷰어 작업량 기반 지연 추정 (20%)
  const pendingReviewerIds = pr.reviewRequests.map((rr) => rr.reviewerId);
  let workloadDelayMs = 0;

  if (pendingReviewerIds.length > 0) {
    const reviewerPending = await prisma.reviewRequest.groupBy({
      by: ["reviewerId"],
      where: {
        reviewerId: { in: pendingReviewerIds },
        fulfilledAt: null,
      },
      _count: { id: true },
    });

    // 리뷰어의 미완료 리뷰가 많을수록 지연
    const maxPending = Math.max(...reviewerPending.map((r) => r._count.id), 0);
    workloadDelayMs = maxPending * 3_600_000; // 미완료 1건당 1시간 추가
  }

  // 가중 평균 계산
  const factors: MergePrediction["factors"] = {
    authorHistory: authorAvg ?? 0,
    reviewerWorkload: workloadDelayMs,
    prSize: sizeAvg ?? 0,
    dayOfWeek: timeAvg ?? 0,
    hourOfDay: timeAvg ?? 0,
  };

  // 사용 가능한 데이터로 가중 평균
  let totalWeight = 0;
  let weightedSum = 0;

  if (authorAvg !== null) {
    weightedSum += authorAvg * 0.4;
    totalWeight += 0.4;
  }
  if (sizeAvg !== null) {
    weightedSum += sizeAvg * 0.2;
    totalWeight += 0.2;
  }
  if (timeAvg !== null) {
    weightedSum += timeAvg * 0.2;
    totalWeight += 0.2;
  }

  // 작업량 지연은 항상 추가
  weightedSum += workloadDelayMs * 0.2;
  totalWeight += 0.2;

  if (totalWeight === 0) return null;

  const predictedMs = weightedSum / totalWeight;

  // 이미 경과된 시간 고려
  const elapsedMs = now.getTime() - createdAt.getTime();
  const remainingMs = Math.max(predictedMs - elapsedMs, 1_800_000); // 최소 30분

  const predictedMergeAt = addMilliseconds(now, remainingMs);

  // 신뢰도 계산
  const dataPoints =
    authorMergeTimes.length + sizeFilteredTimes.length + timeFiltered.length;
  const confidenceLevel: MergePrediction["confidenceLevel"] =
    dataPoints >= 20 ? "high" : dataPoints >= 5 ? "medium" : "low";

  return {
    predictedMergeAt: predictedMergeAt.toISOString(),
    confidenceLevel,
    factors,
  };
}

function getSizeBucketRange(size: number): { min: number; max: number } {
  if (size <= 100) return { min: 0, max: 100 };
  if (size <= 300) return { min: 101, max: 300 };
  if (size <= 500) return { min: 301, max: 500 };
  return { min: 501, max: Infinity };
}

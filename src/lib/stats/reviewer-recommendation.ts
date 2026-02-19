import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

interface RecommendedReviewer {
  user: {
    id: string;
    login: string;
    avatarUrl: string | null;
  };
  score: number;
  reasons: string[];
  stats: {
    repoReviewCount: number;
    avgResponseTimeMs: number;
    pendingReviews: number;
  };
}

interface RecommendationParams {
  repositoryId: string;
  authorId: string;
  installationId: string;
  limit?: number;
}

/**
 * 리뷰어 추천 엔진
 *
 * 점수 계산:
 * - 저장소 리뷰 경험 (40%): 해당 저장소에서 리뷰를 많이 한 사람
 * - 응답 속도 (30%): 평균 응답 시간이 빠른 사람
 * - 현재 작업량 (30%): 미완료 리뷰 요청이 적은 사람
 */
export async function getReviewerRecommendations(
  params: RecommendationParams
): Promise<RecommendedReviewer[]> {
  const { repositoryId, authorId, installationId, limit = 5 } = params;
  const now = new Date();
  const ninetyDaysAgo = subDays(now, 90);

  // 1. 해당 저장소에서 리뷰 경험이 있는 사용자 조회 (최근 90일)
  const repoReviews = await prisma.review.findMany({
    where: {
      pullRequest: { repositoryId },
      submittedAt: { gte: ninetyDaysAgo },
      reviewerId: { not: authorId }, // PR 작성자 제외
      state: { in: ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"] },
    },
    select: {
      reviewerId: true,
      responseTimeMs: true,
      reviewer: {
        select: { id: true, login: true, avatarUrl: true },
      },
    },
  });

  if (repoReviews.length === 0) {
    // 저장소 리뷰가 없으면 같은 org에서 활동하는 리뷰어 폴백
    const orgReviews = await prisma.review.findMany({
      where: {
        pullRequest: {
          repository: { installationId },
        },
        submittedAt: { gte: ninetyDaysAgo },
        reviewerId: { not: authorId },
        state: { in: ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"] },
      },
      select: {
        reviewerId: true,
        responseTimeMs: true,
        reviewer: {
          select: { id: true, login: true, avatarUrl: true },
        },
      },
      take: 200,
    });

    if (orgReviews.length === 0) return [];
    return buildRecommendations(orgReviews, authorId, limit);
  }

  return buildRecommendations(repoReviews, authorId, limit);
}

async function buildRecommendations(
  reviews: Array<{
    reviewerId: string;
    responseTimeMs: bigint | null;
    reviewer: { id: string; login: string; avatarUrl: string | null };
  }>,
  authorId: string,
  limit: number
): Promise<RecommendedReviewer[]> {
  // 리뷰어별 집계
  const reviewerMap = new Map<
    string,
    {
      user: { id: string; login: string; avatarUrl: string | null };
      reviewCount: number;
      responseTimes: number[];
    }
  >();

  for (const r of reviews) {
    if (r.reviewerId === authorId) continue;
    if (!reviewerMap.has(r.reviewerId)) {
      reviewerMap.set(r.reviewerId, {
        user: r.reviewer,
        reviewCount: 0,
        responseTimes: [],
      });
    }
    const entry = reviewerMap.get(r.reviewerId)!;
    entry.reviewCount++;
    if (r.responseTimeMs !== null) {
      entry.responseTimes.push(Number(r.responseTimeMs));
    }
  }

  // 2. 현재 미완료 리뷰 요청 수 조회
  const reviewerIds = [...reviewerMap.keys()];
  const pendingCounts = await prisma.reviewRequest.groupBy({
    by: ["reviewerId"],
    where: {
      reviewerId: { in: reviewerIds },
      fulfilledAt: null,
    },
    _count: { id: true },
  });

  const pendingMap = new Map(
    pendingCounts.map((p) => [p.reviewerId, p._count.id])
  );

  // 3. 점수 계산
  const maxReviewCount = Math.max(...[...reviewerMap.values()].map((v) => v.reviewCount));

  const candidates: RecommendedReviewer[] = [];

  for (const [reviewerId, data] of reviewerMap) {
    const avgResponseTimeMs =
      data.responseTimes.length > 0
        ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
        : Infinity;
    const pendingReviews = pendingMap.get(reviewerId) ?? 0;

    // 경험 점수 (0-40): 리뷰 수가 가장 많으면 40점
    const experienceScore =
      maxReviewCount > 0 ? (data.reviewCount / maxReviewCount) * 40 : 0;

    // 속도 점수 (0-30): 1시간 이내면 만점, 24시간 이상이면 0점
    const ONE_HOUR = 3_600_000;
    const ONE_DAY = 86_400_000;
    const speedScore =
      avgResponseTimeMs === Infinity
        ? 0
        : Math.max(0, Math.min(30, 30 * (1 - (avgResponseTimeMs - ONE_HOUR) / (ONE_DAY - ONE_HOUR))));

    // 여유 점수 (0-30): 미완료 리뷰 0개면 30점, 5개 이상이면 0점
    const workloadScore = Math.max(0, 30 - pendingReviews * 6);

    const totalScore = experienceScore + speedScore + workloadScore;

    // 추천 이유
    const reasons: string[] = [];
    if (experienceScore >= 30) reasons.push("이 저장소 리뷰 경험이 풍부합니다");
    if (speedScore >= 20) reasons.push("빠른 리뷰 응답 속도");
    if (workloadScore >= 24) reasons.push("현재 리뷰 부담이 적습니다");
    if (reasons.length === 0) reasons.push("리뷰 가능한 팀원");

    candidates.push({
      user: data.user,
      score: Math.round(totalScore),
      reasons,
      stats: {
        repoReviewCount: data.reviewCount,
        avgResponseTimeMs: avgResponseTimeMs === Infinity ? 0 : avgResponseTimeMs,
        pendingReviews,
      },
    });
  }

  // 점수 높은 순 정렬
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit);
}

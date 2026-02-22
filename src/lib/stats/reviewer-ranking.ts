import { prisma } from "@/lib/prisma";
import type { ReviewerRanking, DateRangeParams } from "@/types";

export async function getReviewerRankings(
  params: DateRangeParams & { limit?: number }
): Promise<ReviewerRanking[]> {
  const { from, to, installationId, repositoryId, limit = 20 } = params;

  const reviews = await prisma.review.findMany({
    where: {
      submittedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
      pullRequest: {
        repository: {
          installationId,
          ...(repositoryId ? { id: repositoryId } : {}),
        },
      },
      state: { in: ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"] },
    },
    select: {
      reviewerId: true,
      state: true,
      responseTimeMs: true,
      submittedAt: true,
      reviewer: {
        select: {
          id: true,
          login: true,
          avatarUrl: true,
          name: true,
        },
      },
      pullRequest: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  // Group by reviewer
  const reviewerMap = new Map<
    string,
    {
      user: ReviewerRanking["user"];
      responseTimes: number[];
      totalReviews: number;
      approvals: number;
    }
  >();

  for (const review of reviews) {
    const key = review.reviewerId;
    if (!reviewerMap.has(key)) {
      reviewerMap.set(key, {
        user: review.reviewer,
        responseTimes: [],
        totalReviews: 0,
        approvals: 0,
      });
    }
    const entry = reviewerMap.get(key)!;
    entry.totalReviews++;
    if (review.state === "APPROVED") entry.approvals++;
    if (review.responseTimeMs !== null) {
      entry.responseTimes.push(Number(review.responseTimeMs));
    } else if (review.submittedAt && review.pullRequest.createdAt) {
      // Fallback: use PR creation time as baseline
      const fallback = review.submittedAt.getTime() - review.pullRequest.createdAt.getTime();
      if (fallback > 0) {
        entry.responseTimes.push(fallback);
      }
    }
  }

  // Compute rankings
  const rankings: ReviewerRanking[] = [];
  for (const [, entry] of reviewerMap) {
    const avgResponseTimeMs =
      entry.responseTimes.length > 0
        ? entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length
        : 0;

    rankings.push({
      user: entry.user,
      avgResponseTimeMs,
      reviewCount: entry.totalReviews,
      approvalRate: entry.totalReviews > 0 ? (entry.approvals / entry.totalReviews) * 100 : 0,
      rank: 0,
      percentile: 0,
    });
  }

  // Sort by fastest response time
  rankings.sort((a, b) => {
    if (a.avgResponseTimeMs === 0 && b.avgResponseTimeMs === 0) return b.reviewCount - a.reviewCount;
    if (a.avgResponseTimeMs === 0) return 1;
    if (b.avgResponseTimeMs === 0) return -1;
    return a.avgResponseTimeMs - b.avgResponseTimeMs;
  });

  // Assign ranks and percentiles
  const total = rankings.length;
  rankings.forEach((r, i) => {
    r.rank = i + 1;
    r.percentile = total > 1 ? Math.round((1 - i / (total - 1)) * 100) : 100;
  });

  return rankings.slice(0, limit);
}

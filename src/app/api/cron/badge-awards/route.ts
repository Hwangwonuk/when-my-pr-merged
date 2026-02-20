import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { BADGE_SLUGS, HOT_STREAK_THRESHOLD_MS, HOT_STREAK_COUNT } from "@/lib/utils/constants";
import { subDays, format, startOfDay, differenceInCalendarDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const period = format(now, "yyyy-'W'ww");

  const installations = await prisma.installation.findMany({
    where: { suspended: false },
  });

  let badgesAwarded = 0;

  for (const installation of installations) {
    const rankings = await getReviewerRankings({
      installationId: installation.id,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
      limit: 50,
    });

    if (rankings.length === 0) continue;

    // Load all badge definitions
    const allBadges = await prisma.badge.findMany();
    const badgeMap = new Map(allBadges.map((b) => [b.slug, b]));

    // --- 1. Review King (Gold) - 가장 많은 리뷰 ---
    const reviewKing = rankings.reduce((max, r) =>
      r.reviewCount > max.reviewCount ? r : max
    );
    if (reviewKing.reviewCount >= 1 && badgeMap.has(BADGE_SLUGS.REVIEW_KING)) {
      await awardBadge(reviewKing.user.id, badgeMap.get(BADGE_SLUGS.REVIEW_KING)!.id, period);
      badgesAwarded++;
    }

    // --- 2. Lightning Reviewer (Gold) - 가장 빠른 응답 (3건+) ---
    const lightningReviewer = rankings.find(
      (r) => r.avgResponseTimeMs > 0 && r.reviewCount >= 3
    );
    if (lightningReviewer && badgeMap.has(BADGE_SLUGS.LIGHTNING_REVIEWER)) {
      await awardBadge(lightningReviewer.user.id, badgeMap.get(BADGE_SLUGS.LIGHTNING_REVIEWER)!.id, period);
      badgesAwarded++;
    }

    // --- 3. Streak Master (Silver) - 연속 3개 PR 1시간 내 머지 ---
    if (badgeMap.has(BADGE_SLUGS.STREAK_MASTER)) {
      const members = await prisma.member.findMany({
        where: { installationId: installation.id },
        select: { userId: true },
      });

      for (const member of members) {
        const recentPRs = await prisma.pullRequest.findMany({
          where: {
            authorId: member.userId,
            state: "merged",
            mergedAt: { gte: weekAgo },
            timeToMergeMs: { not: null },
          },
          orderBy: { mergedAt: "desc" },
          take: HOT_STREAK_COUNT,
        });

        if (recentPRs.length >= HOT_STREAK_COUNT) {
          const allFast = recentPRs.every(
            (pr) => pr.timeToMergeMs !== null && pr.timeToMergeMs <= BigInt(HOT_STREAK_THRESHOLD_MS)
          );
          if (allFast) {
            await awardBadge(member.userId, badgeMap.get(BADGE_SLUGS.STREAK_MASTER)!.id, period);
            badgesAwarded++;
          }
        }
      }
    }

    // --- 4. Most Helpful (Silver) - CHANGES_REQUESTED 리뷰 최다 (5건+) ---
    if (badgeMap.has(BADGE_SLUGS.MOST_HELPFUL)) {
      const changesRequestedCounts = await prisma.review.groupBy({
        by: ["reviewerId"],
        where: {
          state: "CHANGES_REQUESTED",
          submittedAt: { gte: weekAgo, lte: now },
          pullRequest: {
            repository: { installationId: installation.id },
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      });

      if (changesRequestedCounts.length > 0 && changesRequestedCounts[0]._count.id >= 5) {
        await awardBadge(changesRequestedCounts[0].reviewerId, badgeMap.get(BADGE_SLUGS.MOST_HELPFUL)!.id, period);
        badgesAwarded++;
      }
    }

    // --- 5. Fastest Approver (Bronze) - 가장 빠른 APPROVED 평균 응답 ---
    if (badgeMap.has(BADGE_SLUGS.FASTEST_APPROVER)) {
      const approvalStats = await prisma.review.groupBy({
        by: ["reviewerId"],
        where: {
          state: "APPROVED",
          submittedAt: { gte: weekAgo, lte: now },
          responseTimeMs: { not: null, gt: 0 },
          pullRequest: {
            repository: { installationId: installation.id },
          },
        },
        _count: { id: true },
        _avg: { responseTimeMs: true },
      });

      const qualified = approvalStats
        .filter((s) => s._count.id >= 2 && s._avg.responseTimeMs !== null)
        .sort((a, b) => Number(a._avg.responseTimeMs!) - Number(b._avg.responseTimeMs!));

      if (qualified.length > 0) {
        await awardBadge(qualified[0].reviewerId, badgeMap.get(BADGE_SLUGS.FASTEST_APPROVER)!.id, period);
        badgesAwarded++;
      }
    }

    // --- 6. Small PR Champion (Bronze) - PR의 80%+가 100줄 이하 ---
    if (badgeMap.has(BADGE_SLUGS.SMALL_PR_CHAMPION)) {
      const members = await prisma.member.findMany({
        where: { installationId: installation.id },
        select: { userId: true },
      });

      for (const member of members) {
        const prs = await prisma.pullRequest.findMany({
          where: {
            authorId: member.userId,
            createdAt: { gte: weekAgo, lte: now },
            repository: { installationId: installation.id },
          },
          select: { additions: true, deletions: true },
        });

        if (prs.length >= 3) {
          const smallCount = prs.filter((pr) => pr.additions + pr.deletions <= 100).length;
          if (smallCount / prs.length >= 0.8) {
            await awardBadge(member.userId, badgeMap.get(BADGE_SLUGS.SMALL_PR_CHAMPION)!.id, period);
            badgesAwarded++;
          }
        }
      }
    }

    // --- 7. Consistency Star (Silver) - 5일 연속 매일 리뷰 ---
    if (badgeMap.has(BADGE_SLUGS.CONSISTENCY_STAR)) {
      const members = await prisma.member.findMany({
        where: { installationId: installation.id },
        select: { userId: true },
      });

      for (const member of members) {
        const reviews = await prisma.review.findMany({
          where: {
            reviewerId: member.userId,
            submittedAt: { gte: weekAgo, lte: now },
            pullRequest: {
              repository: { installationId: installation.id },
            },
          },
          select: { submittedAt: true },
          orderBy: { submittedAt: "asc" },
        });

        if (reviews.length < 5) continue;

        // Count unique review days
        const reviewDays = new Set(
          reviews.map((r) => format(startOfDay(r.submittedAt), "yyyy-MM-dd"))
        );

        if (reviewDays.size < 5) continue;

        // Check if there are 5 consecutive days
        const sortedDays = [...reviewDays].sort();
        let maxStreak = 1;
        let currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const diff = differenceInCalendarDays(
            new Date(sortedDays[i]),
            new Date(sortedDays[i - 1])
          );
          if (diff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        if (maxStreak >= 5) {
          await awardBadge(member.userId, badgeMap.get(BADGE_SLUGS.CONSISTENCY_STAR)!.id, period);
          badgesAwarded++;
        }
      }
    }
  }

  return NextResponse.json({ badgesAwarded });
}

async function awardBadge(userId: string, badgeId: string, period: string) {
  await prisma.userBadge.upsert({
    where: {
      userId_badgeId_period: { userId, badgeId, period },
    },
    update: {},
    create: { userId, badgeId, period },
  });
}

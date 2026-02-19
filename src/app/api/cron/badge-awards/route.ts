import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { BADGE_SLUGS } from "@/lib/utils/constants";
import { subDays, format } from "date-fns";

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
      limit: 10,
    });

    if (rankings.length === 0) continue;

    // Review King - most reviews this week
    const reviewKing = rankings.reduce((max, r) =>
      r.reviewCount > max.reviewCount ? r : max
    );

    // Lightning Reviewer - fastest average response
    const lightningReviewer = rankings.find(
      (r) => r.avgResponseTimeMs > 0 && r.reviewCount >= 3
    );

    // Ensure badges exist
    const badges = await Promise.all([
      prisma.badge.upsert({
        where: { slug: BADGE_SLUGS.REVIEW_KING },
        update: {},
        create: {
          slug: BADGE_SLUGS.REVIEW_KING,
          name: "리뷰왕",
          description: "이번 주 가장 많은 리뷰를 한 사람",
          iconUrl: "/badges/review-king.svg",
          tier: "gold",
          criteria: { type: "most_reviews" },
        },
      }),
      prisma.badge.upsert({
        where: { slug: BADGE_SLUGS.LIGHTNING_REVIEWER },
        update: {},
        create: {
          slug: BADGE_SLUGS.LIGHTNING_REVIEWER,
          name: "번개 리뷰어",
          description: "가장 빠른 평균 리뷰 응답 속도",
          iconUrl: "/badges/lightning-reviewer.svg",
          tier: "gold",
          criteria: { type: "fastest_response" },
        },
      }),
    ]);

    // Award Review King
    if (reviewKing.reviewCount >= 1) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId_period: {
            userId: reviewKing.user.id,
            badgeId: badges[0].id,
            period,
          },
        },
        update: {},
        create: {
          userId: reviewKing.user.id,
          badgeId: badges[0].id,
          period,
        },
      });
      badgesAwarded++;
    }

    // Award Lightning Reviewer
    if (lightningReviewer) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId_period: {
            userId: lightningReviewer.user.id,
            badgeId: badges[1].id,
            period,
          },
        },
        update: {},
        create: {
          userId: lightningReviewer.user.id,
          badgeId: badges[1].id,
          period,
        },
      });
      badgesAwarded++;
    }
  }

  return NextResponse.json({ badgesAwarded });
}

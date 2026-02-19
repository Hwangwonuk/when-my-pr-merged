import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new (PrismaClient as unknown as new () => InstanceType<typeof PrismaClient>)();

const badges = [
  {
    slug: "review-king",
    name: "리뷰왕",
    description: "해당 기간 가장 많은 리뷰를 남긴 팀원",
    iconUrl: "👑",
    tier: "gold",
    criteria: { type: "most_reviews", min: 10 },
  },
  {
    slug: "lightning-reviewer",
    name: "번개 리뷰어",
    description: "평균 리뷰 응답 시간이 30분 이내",
    iconUrl: "⚡",
    tier: "gold",
    criteria: { type: "avg_response_time", maxMs: 1_800_000 },
  },
  {
    slug: "streak-master",
    name: "스트릭 마스터",
    description: "연속 3개 PR이 1시간 내 머지",
    iconUrl: "🔥",
    tier: "silver",
    criteria: { type: "hot_streak", count: 3, withinMs: 3_600_000 },
  },
  {
    slug: "most-helpful",
    name: "도움왕",
    description: "CHANGES_REQUESTED 리뷰를 가장 많이 남겨 코드 품질 향상에 기여",
    iconUrl: "🤝",
    tier: "silver",
    criteria: { type: "most_changes_requested", min: 5 },
  },
  {
    slug: "fastest-approver",
    name: "최속 승인자",
    description: "APPROVED 리뷰의 평균 응답 시간이 가장 짧음",
    iconUrl: "🚀",
    tier: "bronze",
    criteria: { type: "fastest_approval" },
  },
  {
    slug: "small-pr-champion",
    name: "작은 PR 챔피언",
    description: "올린 PR의 80% 이상이 100줄 이하",
    iconUrl: "✂️",
    tier: "bronze",
    criteria: { type: "small_pr_ratio", minRatio: 0.8 },
  },
  {
    slug: "consistency-star",
    name: "꾸준한 리뷰어",
    description: "매일 1개 이상 리뷰를 5일 연속 수행",
    iconUrl: "⭐",
    tier: "silver",
    criteria: { type: "daily_review_streak", days: 5 },
  },
];

async function main() {
  console.log("Seeding badges...");

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        tier: badge.tier,
        criteria: badge.criteria,
      },
      create: badge,
    });
    console.log(`  ✓ ${badge.name} (${badge.slug})`);
  }

  console.log(`\nSeeded ${badges.length} badges.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

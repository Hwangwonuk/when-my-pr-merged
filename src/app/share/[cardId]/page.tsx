import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils/format";
import { subDays } from "date-fns";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ cardId: string }>;
}

// cardId format: "user-{userId}" or "user-{login}"
async function getUserStats(cardId: string) {
  const identifier = cardId.replace("user-", "");

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: identifier }, { login: identifier }],
    },
    include: {
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [reviews, mergedPRs] = await Promise.all([
    prisma.review.findMany({
      where: {
        reviewerId: user.id,
        submittedAt: { gte: thirtyDaysAgo, lte: now },
      },
      select: { responseTimeMs: true },
    }),
    prisma.pullRequest.count({
      where: {
        authorId: user.id,
        state: "merged",
        mergedAt: { gte: thirtyDaysAgo, lte: now },
      },
    }),
  ]);

  const responseTimes = reviews
    .filter((r) => r.responseTimeMs !== null)
    .map((r) => Number(r.responseTimeMs));
  const avgResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  return {
    user,
    reviewCount: reviews.length,
    avgResponseTimeMs,
    mergedPRs,
    badges: user.badges.map((ub) => ub.badge.iconUrl),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cardId } = await params;
  const stats = await getUserStats(cardId);
  if (!stats) return { title: "Not Found" };

  const ogUrl = new URL(
    `/api/og/stats-card?login=${stats.user.login}&avatar=${encodeURIComponent(stats.user.avatarUrl ?? "")}&reviews=${stats.reviewCount}&responseTime=${stats.avgResponseTimeMs > 0 ? formatDuration(stats.avgResponseTimeMs) : "--"}&mergedPRs=${stats.mergedPRs}&badges=${stats.badges.join(",")}`,
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );

  return {
    title: `${stats.user.login}의 리뷰 통계 | 내 PR 언제 머지돼?`,
    description: `리뷰 ${stats.reviewCount}건, 평균 응답 ${stats.avgResponseTimeMs > 0 ? formatDuration(stats.avgResponseTimeMs) : "N/A"}`,
    openGraph: {
      title: `${stats.user.login}의 리뷰 통계`,
      description: `리뷰 ${stats.reviewCount}건 · 머지 PR ${stats.mergedPRs}개`,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${stats.user.login}의 리뷰 통계`,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ShareCardPage({ params }: Props) {
  const { cardId } = await params;
  const stats = await getUserStats(cardId);

  if (!stats) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-indigo-950 border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <p className="text-sm text-indigo-400 font-medium mb-4">
              내 PR 언제 머지돼?
            </p>
            <div className="flex items-center gap-4">
              {stats.user.avatarUrl && (
                <img
                  src={stats.user.avatarUrl}
                  alt={stats.user.login}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {stats.user.name ?? stats.user.login}
                </h1>
                <p className="text-gray-400">@{stats.user.login}</p>
              </div>
              {stats.badges.length > 0 && (
                <div className="ml-auto flex gap-1">
                  {stats.badges.map((b, i) => (
                    <span key={i} className="text-2xl">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-gray-700/30 mt-4">
            <div className="bg-gray-900/80 px-6 py-5 text-center">
              <p className="text-xs text-gray-400 mb-1">리뷰 건수</p>
              <p className="text-2xl font-bold">{stats.reviewCount}건</p>
            </div>
            <div className="bg-gray-900/80 px-6 py-5 text-center">
              <p className="text-xs text-gray-400 mb-1">평균 응답</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.avgResponseTimeMs > 0
                  ? formatDuration(stats.avgResponseTimeMs)
                  : "--"}
              </p>
            </div>
            <div className="bg-gray-900/80 px-6 py-5 text-center">
              <p className="text-xs text-gray-400 mb-1">머지 PR</p>
              <p className="text-2xl font-bold text-amber-400">
                {stats.mergedPRs}개
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 text-center">
            <p className="text-xs text-gray-500">최근 30일 · 자동 생성</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/" className="text-indigo-400 hover:text-indigo-300">
            내 PR 언제 머지돼?
          </a>
          에서 나만의 통계 카드를 만들어보세요.
        </p>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { EmptyState } from "@/components/shared/empty-state";
import { RankBadge } from "@/components/shared/rank-badge";
import { formatDuration } from "@/lib/utils/format";
import { Trophy } from "lucide-react";
import { subDays } from "date-fns";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { period = "30d" } = await searchParams;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">팀 리더보드</h1>
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="리더보드를 보려면 먼저 GitHub App을 설치해주세요."
        />
      </div>
    );
  }

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const now = new Date();
  const from = subDays(now, days);

  const dateParams = {
    installationId: installation.id,
    from: from.toISOString(),
    to: now.toISOString(),
  };

  const rankings = await getReviewerRankings({ ...dateParams, limit: 50 });

  // 배지 정보 (해당 기간 수여된 배지들)
  const userBadges = await prisma.userBadge.findMany({
    where: {
      awardedAt: { gte: from, lte: now },
      user: {
        memberships: { some: { installationId: installation.id } },
      },
    },
    include: {
      badge: true,
      user: { select: { id: true, login: true } },
    },
    orderBy: { awardedAt: "desc" },
  });

  // 그룹별로 배지를 유저에 매핑
  const badgesByUser = new Map<string, Array<{ icon: string; name: string; tier: string }>>();
  for (const ub of userBadges) {
    if (!badgesByUser.has(ub.user.id)) {
      badgesByUser.set(ub.user.id, []);
    }
    badgesByUser.get(ub.user.id)!.push({
      icon: ub.badge.iconUrl,
      name: ub.badge.name,
      tier: ub.badge.tier,
    });
  }

  // PR 작성자별 통계
  const authorStats = await prisma.pullRequest.groupBy({
    by: ["authorId"],
    where: {
      repository: { installationId: installation.id },
      state: "merged",
      mergedAt: { gte: from, lte: now },
    },
    _count: { id: true },
    _avg: { revisionCount: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const authorUsers = authorStats.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: authorStats.map((a) => a.authorId) } },
        select: { id: true, login: true, avatarUrl: true },
      })
    : [];

  const authorUserMap = new Map(authorUsers.map((u) => [u.id, u]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">팀 리더보드</h1>
        <div className="flex gap-1 rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {[
            { value: "7d", label: "7일" },
            { value: "30d", label: "30일" },
            { value: "90d", label: "90일" },
          ].map((p) => (
            <a
              key={p.value}
              href={`/${orgSlug}/leaderboard?period=${p.value}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p.value
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {rankings.length === 0 && authorStats.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="리더보드 데이터가 없습니다"
          description="이 기간에 리뷰 활동이 없습니다. 기간을 변경하거나 데이터가 쌓이기를 기다려주세요."
        />
      ) : (
        <div className="space-y-6">
          {/* 리뷰어 리더보드 */}
          {rankings.length > 0 && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold mb-4">리뷰어 리더보드</h2>
              <div className="space-y-3">
                {rankings.slice(0, 10).map((reviewer) => {
                  const userBadgeList = badgesByUser.get(reviewer.user.id) ?? [];

                  return (
                    <div
                      key={reviewer.user.id}
                      className="flex items-center gap-4 rounded-lg bg-gray-700/20 px-4 py-3"
                    >
                      <RankBadge rank={reviewer.rank} size="md" />
                      {reviewer.user.avatarUrl && (
                        <img
                          src={reviewer.user.avatarUrl}
                          alt={reviewer.user.login}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {reviewer.user.login}
                          </span>
                          {userBadgeList.map((b, i) => (
                            <span key={i} title={b.name} className="text-sm">
                              {b.icon}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          리뷰 {reviewer.reviewCount}건 · 승인율{" "}
                          {reviewer.approvalRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {reviewer.avgResponseTimeMs > 0
                            ? formatDuration(reviewer.avgResponseTimeMs)
                            : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">평균 응답</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PR 머지 리더보드 */}
          {authorStats.length > 0 && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold mb-4">PR 머지 리더보드</h2>
              <div className="space-y-3">
                {authorStats.map((stat, i) => {
                  const user = authorUserMap.get(stat.authorId);
                  if (!user) return null;

                  return (
                    <div
                      key={stat.authorId}
                      className="flex items-center gap-4 rounded-lg bg-gray-700/20 px-4 py-3"
                    >
                      <RankBadge rank={i + 1} size="md" />
                      {user.avatarUrl && (
                        <img
                          src={user.avatarUrl}
                          alt={user.login}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <span className="font-medium text-white">
                          {user.login}
                        </span>
                        <p className="text-xs text-gray-500">
                          평균 수정 {(stat._avg.revisionCount ?? 0).toFixed(1)}회
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {stat._count.id}개
                        </p>
                        <p className="text-xs text-gray-500">머지된 PR</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 최근 배지 */}
          {userBadges.length > 0 && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold mb-4">최근 수여된 배지</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userBadges.slice(0, 6).map((ub) => (
                  <div
                    key={ub.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-700/20 px-4 py-3"
                  >
                    <span className="text-2xl">{ub.badge.iconUrl}</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ub.badge.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ub.user.login} · {ub.period ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

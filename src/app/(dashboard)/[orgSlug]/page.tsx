import { prisma } from "@/lib/prisma";
import { getOverviewStats } from "@/lib/stats/calculator";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { getMergePrediction } from "@/lib/stats/predictions";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PredictionWidget } from "@/components/dashboard/prediction-widget";
import { EmptyState } from "@/components/shared/empty-state";
import { RankBadge } from "@/components/shared/rank-badge";
import { formatDuration, formatPercentage, formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { subDays } from "date-fns";
import { Link2, Rocket, GitPullRequest, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

async function OpenPRPredictions({ installationId }: { installationId: string }) {
  const openPRs = await prisma.pullRequest.findMany({
    where: {
      repository: { installationId },
      state: "open",
    },
    include: {
      author: { select: { login: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (openPRs.length === 0) return null;

  const predictions = await Promise.all(
    openPRs.map(async (pr) => {
      const prediction = await getMergePrediction({ prId: pr.id, installationId });
      if (!prediction) return null;
      return {
        pr: {
          number: pr.number,
          title: pr.title,
          authorLogin: pr.author.login,
          createdAt: pr.createdAt.toISOString(),
        },
        predictedMergeAt: prediction.predictedMergeAt,
        confidenceLevel: prediction.confidenceLevel,
      };
    })
  );

  const validPredictions = predictions.filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

  return (
    <div className="mb-8">
      <PredictionWidget predictions={validPredictions} />
    </div>
  );
}

export default async function OrgDashboardPage({ params }: Props) {
  const { orgSlug } = await params;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">{orgSlug}</h1>
        <EmptyState
          icon={<Link2 className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="이 조직에 GitHub App을 설치해야 PR 데이터를 수집할 수 있습니다."
        />
      </div>
    );
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const dateParams = {
    installationId: installation.id,
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString(),
  };

  const [overview, topReviewers, recentMerged, stalePRs] = await Promise.all([
    getOverviewStats(dateParams),
    getReviewerRankings({ ...dateParams, limit: 5 }),
    prisma.pullRequest.findMany({
      where: {
        repository: { installationId: installation.id },
        state: "merged",
        mergedAt: { gte: thirtyDaysAgo },
      },
      include: {
        author: { select: { login: true, avatarUrl: true } },
        repository: { select: { name: true, fullName: true } },
      },
      orderBy: { mergedAt: "desc" },
      take: 5,
    }),
    prisma.pullRequest.findMany({
      where: {
        repository: { installationId: installation.id },
        state: "open",
        draft: false,
        firstReviewAt: null,
        createdAt: { lte: subDays(now, 1) },
      },
      include: {
        author: { select: { login: true, avatarUrl: true } },
        repository: { select: { name: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  if (overview.totalPRs === 0) {
    return (
      <div>
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">{orgSlug} 대시보드</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-b border-gray-800/50 pb-6 mb-8">
          <StatsCard title="총 PR 수" value="0" subtitle="최근 30일" />
          <StatsCard title="평균 머지 시간" value="--" subtitle="데이터 없음" />
          <StatsCard title="평균 첫 리뷰 시간" value="--" subtitle="데이터 없음" />
          <StatsCard title="머지율" value="--" subtitle="데이터 없음" />
        </div>
        <EmptyState
          icon={<Rocket className="w-12 h-12" />}
          title="데이터를 수집하고 있습니다"
          description="GitHub App이 설치되었습니다! PR이 생성되면 자동으로 통계가 표시됩니다."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">{orgSlug} 대시보드</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-b border-gray-800/50 pb-6 mb-8">
        <StatsCard
          title="총 PR 수"
          value={formatNumber(overview.totalPRs)}
          subtitle={
            overview.closedPRs > 0
              ? `머지: ${overview.mergedPRs} / 오픈: ${overview.openPRs} / 클로즈: ${overview.closedPRs}`
              : `머지: ${overview.mergedPRs} / 오픈: ${overview.openPRs}`
          }
        />
        <StatsCard
          title="평균 머지 시간"
          value={formatDuration(overview.avgTimeToMergeMs)}
          subtitle={`중앙값: ${formatDuration(overview.medianTimeToMergeMs)}`}
          trend={overview.trend.timeToMerge}
        />
        <StatsCard
          title="평균 첫 리뷰 시간"
          value={overview.avgTimeToFirstReviewMs > 0 ? formatDuration(overview.avgTimeToFirstReviewMs) : "--"}
          subtitle={overview.avgTimeToFirstReviewMs > 0 ? undefined : "리뷰 데이터 없음"}
          trend={overview.avgTimeToFirstReviewMs > 0 ? overview.trend.timeToFirstReview : undefined}
        />
        <StatsCard
          title="머지율"
          value={formatPercentage(overview.mergeRate, 0)}
          subtitle={`평균 ${overview.avgRevisionCount.toFixed(1)}회 수정 후 머지`}
        />
      </div>

      {/* Merge Predictions */}
      <OpenPRPredictions installationId={installation.id} />

      {/* Stale PRs */}
      {stalePRs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            방치 PR ({stalePRs.length})
          </h2>
          <div className="space-y-0">
            {stalePRs.map((pr) => {
              const waitingHours = Math.floor(
                (now.getTime() - pr.createdAt.getTime()) / (60 * 60 * 1000)
              );
              return (
                <a
                  key={pr.id}
                  href={`https://github.com/${pr.repository.fullName}/pull/${pr.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GitPullRequest className="w-4 h-4 text-amber-400 shrink-0" />
                    {pr.author.avatarUrl && (
                      <img
                        src={pr.author.avatarUrl}
                        alt={pr.author.login}
                        className="w-5 h-5 rounded-full shrink-0"
                      />
                    )}
                    <span className="text-[13px] text-white truncate group-hover:text-indigo-400 transition-colors">
                      {pr.title}
                    </span>
                    <span className="text-[11px] text-gray-600 shrink-0">
                      #{pr.number}
                    </span>
                  </div>
                  <div className="text-[13px] text-amber-400/80 tabular-nums shrink-0 ml-4">
                    {waitingHours}시간 대기
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Reviewers */}
      {topReviewers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Top 리뷰어 (최근 30일)</h2>
          <div className="space-y-0">
            {topReviewers.map((reviewer) => (
              <div
                key={reviewer.user.id}
                className="flex items-center justify-between px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={reviewer.rank} />
                  {reviewer.user.avatarUrl && (
                    <img
                      src={reviewer.user.avatarUrl}
                      alt={reviewer.user.login}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-[13px] text-white">{reviewer.user.login}</span>
                </div>
                <div className="text-[13px] text-gray-500 tabular-nums">
                  {reviewer.avgResponseTimeMs > 0
                    ? formatDuration(reviewer.avgResponseTimeMs)
                    : "N/A"}{" "}
                  · {reviewer.reviewCount}건
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentMerged.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-3">최근 머지된 PR</h2>
          <div className="space-y-0">
            {recentMerged.map((pr) => (
              <a
                key={pr.id}
                href={`https://github.com/${pr.repository.fullName}/pull/${pr.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GitPullRequest className="w-4 h-4 text-purple-400 shrink-0" />
                  {pr.author.avatarUrl && (
                    <img
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                      className="w-5 h-5 rounded-full shrink-0"
                    />
                  )}
                  <span className="text-[13px] text-white truncate group-hover:text-indigo-400 transition-colors">
                    {pr.title}
                  </span>
                  <span className="text-[11px] text-gray-600 shrink-0">
                    {pr.repository.name}
                  </span>
                </div>
                <div className="text-[13px] text-gray-500 tabular-nums shrink-0 ml-4">
                  {pr.mergedAt ? formatRelativeTime(pr.mergedAt) : ""}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

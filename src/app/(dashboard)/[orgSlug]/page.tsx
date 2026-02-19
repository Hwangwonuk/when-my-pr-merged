import { prisma } from "@/lib/prisma";
import { getOverviewStats } from "@/lib/stats/calculator";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { getMergePrediction } from "@/lib/stats/predictions";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PredictionWidget } from "@/components/dashboard/prediction-widget";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDuration, formatPercentage, formatNumber } from "@/lib/utils/format";
import { subDays } from "date-fns";

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
        <h1 className="text-2xl font-bold mb-8">{orgSlug}</h1>
        <EmptyState
          icon="🔗"
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

  const [overview, topReviewers] = await Promise.all([
    getOverviewStats(dateParams),
    getReviewerRankings({ ...dateParams, limit: 5 }),
  ]);

  if (overview.totalPRs === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">{orgSlug} 대시보드</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="총 PR 수" value="0" subtitle="최근 30일" />
          <StatsCard title="평균 머지 시간" value="--" subtitle="데이터 없음" />
          <StatsCard title="평균 첫 리뷰 시간" value="--" subtitle="데이터 없음" />
          <StatsCard title="머지율" value="--" subtitle="데이터 없음" />
        </div>
        <EmptyState
          icon="🚀"
          title="데이터를 수집하고 있습니다"
          description="GitHub App이 설치되었습니다! PR이 생성되면 자동으로 통계가 표시됩니다."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">{orgSlug} 대시보드</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="총 PR 수"
          value={formatNumber(overview.totalPRs)}
          subtitle={`머지: ${overview.mergedPRs} / 오픈: ${overview.openPRs}`}
        />
        <StatsCard
          title="평균 머지 시간"
          value={formatDuration(overview.avgTimeToMergeMs)}
          subtitle={`중앙값: ${formatDuration(overview.medianTimeToMergeMs)}`}
          trend={overview.trend.timeToMerge}
        />
        <StatsCard
          title="평균 첫 리뷰 시간"
          value={formatDuration(overview.avgTimeToFirstReviewMs)}
          trend={overview.trend.timeToFirstReview}
        />
        <StatsCard
          title="머지율"
          value={formatPercentage(overview.mergeRate, 0)}
          subtitle={`평균 ${overview.avgRevisionCount.toFixed(1)}회 수정 후 머지`}
        />
      </div>

      {/* Merge Predictions */}
      <OpenPRPredictions installationId={installation.id} />

      {/* Top Reviewers */}
      {topReviewers.length > 0 && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Top 리뷰어 (최근 30일)</h2>
          <div className="space-y-3">
            {topReviewers.map((reviewer) => (
              <div
                key={reviewer.user.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">
                    {reviewer.rank <= 3
                      ? ["🥇", "🥈", "🥉"][reviewer.rank - 1]
                      : `${reviewer.rank}.`}
                  </span>
                  {reviewer.user.avatarUrl && (
                    <img
                      src={reviewer.user.avatarUrl}
                      alt={reviewer.user.login}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm text-white">{reviewer.user.login}</span>
                </div>
                <div className="text-sm text-gray-400">
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
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { getBottleneckAnalysis } from "@/lib/stats/patterns";
import { getConflictPatterns } from "@/lib/stats/conflict-patterns";
import { EmptyState } from "@/components/shared/empty-state";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { BottleneckAnalysisView } from "@/components/dashboard/bottleneck-analysis";
import { formatDuration, formatPercentage } from "@/lib/utils/format";
import { subDays } from "date-fns";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function InsightsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { period = "30d" } = await searchParams;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">인사이트</h1>
        <EmptyState
          icon={<Lightbulb className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="인사이트를 보려면 먼저 GitHub App을 설치해주세요."
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

  const [bottleneck, conflictPatterns] = await Promise.all([
    getBottleneckAnalysis(dateParams),
    getConflictPatterns(dateParams),
  ]);

  // Rework stats
  const mergedPRs = await prisma.pullRequest.findMany({
    where: {
      repository: { installationId: installation.id },
      state: "merged",
      mergedAt: { gte: from, lte: now },
    },
    select: { revisionCount: true, reviewCycleCount: true },
  });

  const avgRevisionCount =
    mergedPRs.length > 0
      ? mergedPRs.reduce((sum, pr) => sum + pr.revisionCount, 0) / mergedPRs.length
      : 0;

  const avgReviewCycles =
    mergedPRs.length > 0
      ? mergedPRs.reduce((sum, pr) => sum + pr.reviewCycleCount, 0) / mergedPRs.length
      : 0;

  const hasData = bottleneck.avgTotalMs > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider">인사이트</h1>
        <div className="flex gap-0.5">
          {[
            { value: "7d", label: "7일" },
            { value: "30d", label: "30일" },
            { value: "90d", label: "90일" },
          ].map((p) => (
            <a
              key={p.value}
              href={`/${orgSlug}/insights?period=${p.value}`}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors duration-200 ${
                period === p.value
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={<Lightbulb className="w-12 h-12" />}
          title="인사이트를 분석 중입니다"
          description="충분한 데이터가 수집되면 병목 지점 분석과 재작업 통계를 확인할 수 있습니다."
        />
      ) : (
        <div className="space-y-8">
          <BottleneckAnalysisView data={bottleneck} />

          {/* Rework Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-800/50 pb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">평균 수정 횟수</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
                {avgRevisionCount.toFixed(1)}회
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                리뷰 시작 후 머지까지 평균 코드 수정 횟수
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">평균 리뷰 사이클</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
                {avgReviewCycles.toFixed(1)}회
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Changes Requested → 재리뷰 사이클 횟수
              </p>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">핵심 인사이트</h3>
            <div className="space-y-2">
              <p className="text-[13px] text-gray-400 px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200">
                첫 리뷰까지 평균 {formatDuration(bottleneck.avgTimeToFirstReviewMs)} vs 승인 후 머지까지 {formatDuration(bottleneck.avgApprovalToMergeMs)}
              </p>
              <p className="text-[13px] text-gray-400 px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200">
                평균 {avgRevisionCount.toFixed(1)}회 수정 후 머지
              </p>
              {bottleneck.avgTimeToFirstReviewMs > bottleneck.avgFirstReviewToApprovalMs + bottleneck.avgApprovalToMergeMs && (
                <div className="flex items-start gap-2 text-[13px] text-red-400 px-3 py-2.5 -mx-3">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>첫 리뷰까지의 대기 시간이 가장 큰 병목입니다. 리뷰 요청 후 빠른 응답을 독려해보세요.</span>
                </div>
              )}
            </div>
          </div>

          {/* Conflict Pattern Analysis */}
          {conflictPatterns.totalPRs > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">컨플릭트 패턴 분석</h3>

              {/* Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-800/50 pb-6 mb-6">
                <div>
                  <p className="text-xs text-gray-500">컨플릭트 발생률</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-white mt-1">
                    {formatPercentage(conflictPatterns.conflictRate * 100)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {conflictPatterns.conflictPRs}/{conflictPatterns.totalPRs} PR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">평균 해결 시간</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-white mt-1">
                    {conflictPatterns.avgResolutionTimeMs > 0
                      ? formatDuration(conflictPatterns.avgResolutionTimeMs)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">가장 위험한 요일</p>
                  <p className="text-2xl font-semibold tracking-tight text-white mt-1">
                    {(() => {
                      const worst = conflictPatterns.byDay
                        .filter((d) => d.totalCount > 0)
                        .sort((a, b) => b.conflictRate - a.conflictRate)[0];
                      return worst ? `${worst.dayName} (${formatPercentage(worst.conflictRate * 100)})` : "-";
                    })()}
                  </p>
                </div>
              </div>

              {/* By Day */}
              <div className="mb-6">
                <h4 className="text-xs text-gray-500 mb-3">요일별 컨플릭트 발생률</h4>
                <div className="flex gap-2">
                  {conflictPatterns.byDay.map((day) => {
                    const height = day.conflictRate > 0 ? Math.max(day.conflictRate * 200, 4) : 4;
                    return (
                      <div key={day.dayOfWeek} className="flex-1 flex flex-col items-center gap-1">
                        <div className="h-[100px] flex items-end w-full">
                          <div
                            className={`w-full rounded-t ${day.totalCount > 0 ? "bg-indigo-500" : "bg-gray-800/30"}`}
                            style={{ height: `${Math.min(height, 100)}px`, opacity: day.totalCount > 0 ? Math.max(day.conflictRate * 2, 0.2) : 0.1 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{day.dayName}</span>
                        <span className="text-xs text-gray-600 tabular-nums">
                          {day.totalCount > 0 ? formatPercentage(day.conflictRate * 100) : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Size */}
              <div>
                <h4 className="text-xs text-gray-500 mb-3">PR 크기별 컨플릭트 발생률</h4>
                <div className="space-y-2">
                  {conflictPatterns.bySize.map((size) => (
                    <div key={size.bucket} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8">{size.bucket}</span>
                      <div className="flex-1 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${Math.max(size.conflictRate * 100, 1)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums w-16 text-right">
                        {size.totalCount > 0 ? formatPercentage(size.conflictRate * 100) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              {conflictPatterns.conflictRate > 0.2 && (
                <div className="mt-4 flex items-start gap-2 text-[13px] text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>컨플릭트 발생률이 {formatPercentage(conflictPatterns.conflictRate * 100)}로 높습니다.
                  PR을 더 작게 나누고, 베이스 브랜치를 자주 리베이스하는 것을 권장합니다.</span>
                </div>
              )}
              {(() => {
                const xlConflict = conflictPatterns.bySize.find((s) => s.bucket === "XL");
                const sConflict = conflictPatterns.bySize.find((s) => s.bucket === "S");
                if (
                  xlConflict && sConflict &&
                  xlConflict.totalCount > 0 && sConflict.totalCount > 0 &&
                  xlConflict.conflictRate > sConflict.conflictRate * 2
                ) {
                  return (
                    <p className="mt-2 text-[13px] text-gray-500">
                      XL PR의 컨플릭트 발생률({formatPercentage(xlConflict.conflictRate * 100)})이
                      S PR({formatPercentage(sConflict.conflictRate * 100)})보다 {(xlConflict.conflictRate / sConflict.conflictRate).toFixed(1)}배 높습니다.
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

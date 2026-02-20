import { prisma } from "@/lib/prisma";
import { getOverviewStats } from "@/lib/stats/calculator";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import { formatDuration, formatPercentage, formatNumber } from "@/lib/utils/format";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function ReportsPage({ params }: Props) {
  const { orgSlug } = await params;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">리포트</h1>
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="리포트를 보려면 먼저 GitHub App을 설치해주세요."
        />
      </div>
    );
  }

  // 최근 3개월 리포트 생성
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = subMonths(now, i);
    return {
      label: format(d, "yyyy년 M월", { locale: ko }),
      from: startOfMonth(d),
      to: i === 0 ? now : endOfMonth(d),
    };
  });

  const monthlyStats = await Promise.all(
    months.map(async (m) => {
      const stats = await getOverviewStats({
        installationId: installation.id,
        from: m.from.toISOString(),
        to: m.to.toISOString(),
      });
      return { ...m, stats };
    })
  );

  const hasData = monthlyStats.some((m) => m.stats.totalPRs > 0);

  if (!hasData) {
    return (
      <div>
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">리포트</h1>
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="리포트를 생성 중입니다"
          description="PR 데이터가 충분히 수집되면 월간 리포트를 확인할 수 있습니다."
        />
      </div>
    );
  }

  // 이번 달 vs 지난 달 비교
  const current = monthlyStats[0].stats;
  const previous = monthlyStats[1].stats;

  const mergeTimeDiff =
    previous.avgTimeToMergeMs > 0
      ? ((current.avgTimeToMergeMs - previous.avgTimeToMergeMs) / previous.avgTimeToMergeMs) * 100
      : 0;

  const firstReviewDiff =
    previous.avgTimeToFirstReviewMs > 0
      ? ((current.avgTimeToFirstReviewMs - previous.avgTimeToFirstReviewMs) / previous.avgTimeToFirstReviewMs) * 100
      : 0;

  return (
    <div>
      <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">리포트</h1>

      {/* 이번 달 요약 */}
      <div className="border-b border-gray-800/50 pb-6 mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-4">
          {monthlyStats[0].label} 요약
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-xs text-gray-500 mb-1">총 PR</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
              {formatNumber(current.totalPRs)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">머지된 PR</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
              {formatNumber(current.mergedPRs)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">평균 머지 시간</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
              {current.avgTimeToMergeMs > 0
                ? formatDuration(current.avgTimeToMergeMs)
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">머지율</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
              {current.totalPRs > 0
                ? formatPercentage(current.mergeRate, 0)
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* 전월 대비 변화 */}
      {previous.totalPRs > 0 && (
        <div className="border-b border-gray-800/50 pb-6 mb-8">
          <h2 className="text-sm font-medium text-gray-300 mb-4">전월 대비 변화</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-1">PR 수 변화</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {current.totalPRs - previous.totalPRs > 0 ? "+" : ""}
                  {current.totalPRs - previous.totalPRs}개
                </p>
                <span
                  className={`text-xs tabular-nums ${
                    current.totalPRs >= previous.totalPRs
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {previous.totalPRs > 0
                    ? `${(((current.totalPRs - previous.totalPRs) / previous.totalPRs) * 100).toFixed(0)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">평균 머지 시간 변화</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {current.avgTimeToMergeMs > 0
                    ? formatDuration(current.avgTimeToMergeMs)
                    : "--"}
                </p>
                {mergeTimeDiff !== 0 && (
                  <span
                    className={`text-xs tabular-nums ${
                      mergeTimeDiff < 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {mergeTimeDiff > 0 ? "+" : ""}
                    {mergeTimeDiff.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                평균 첫 리뷰 시간 변화
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {current.avgTimeToFirstReviewMs > 0
                    ? formatDuration(current.avgTimeToFirstReviewMs)
                    : "--"}
                </p>
                {firstReviewDiff !== 0 && (
                  <span
                    className={`text-xs tabular-nums ${
                      firstReviewDiff < 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {firstReviewDiff > 0 ? "+" : ""}
                    {firstReviewDiff.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 월별 추이 */}
      <div>
        <h2 className="text-sm font-medium text-gray-300 mb-4">월별 추이</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-800/50">
                <th className="pb-2.5 text-xs text-gray-500 font-medium">기간</th>
                <th className="pb-2.5 text-xs text-gray-500 font-medium text-right">총 PR</th>
                <th className="pb-2.5 text-xs text-gray-500 font-medium text-right">머지 PR</th>
                <th className="pb-2.5 text-xs text-gray-500 font-medium text-right">평균 머지 시간</th>
                <th className="pb-2.5 text-xs text-gray-500 font-medium text-right">평균 첫 리뷰</th>
                <th className="pb-2.5 text-xs text-gray-500 font-medium text-right">머지율</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((m) => (
                <tr
                  key={m.label}
                  className="border-b border-gray-800/30 hover:bg-gray-800/40 transition-all duration-200"
                >
                  <td className="py-2.5 text-[13px] font-medium text-white">{m.label}</td>
                  <td className="py-2.5 text-[13px] text-right text-gray-400 tabular-nums">
                    {formatNumber(m.stats.totalPRs)}
                  </td>
                  <td className="py-2.5 text-[13px] text-right text-gray-400 tabular-nums">
                    {formatNumber(m.stats.mergedPRs)}
                  </td>
                  <td className="py-2.5 text-[13px] text-right text-gray-400 tabular-nums">
                    {m.stats.avgTimeToMergeMs > 0
                      ? formatDuration(m.stats.avgTimeToMergeMs)
                      : "--"}
                  </td>
                  <td className="py-2.5 text-[13px] text-right text-gray-400 tabular-nums">
                    {m.stats.avgTimeToFirstReviewMs > 0
                      ? formatDuration(m.stats.avgTimeToFirstReviewMs)
                      : "--"}
                  </td>
                  <td className="py-2.5 text-[13px] text-right text-gray-400 tabular-nums">
                    {m.stats.totalPRs > 0
                      ? formatPercentage(m.stats.mergeRate, 0)
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

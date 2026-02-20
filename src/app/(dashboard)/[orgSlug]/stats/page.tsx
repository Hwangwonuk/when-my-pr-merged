import { prisma } from "@/lib/prisma";
import { getHourlyPatterns, getDailyPatterns, getSizeAnalysis } from "@/lib/stats/patterns";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";
import { HourlyHeatmap } from "@/components/charts/hourly-heatmap";
import { MergeTimeByDayChart } from "@/components/charts/merge-time-chart";
import { PrSizeChart } from "@/components/charts/pr-size-chart";
import { subDays } from "date-fns";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function StatsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { period = "30d" } = await searchParams;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">핵심 통계</h1>
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="통계를 보려면 먼저 GitHub App을 설치해주세요."
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

  const [hourly, daily, sizeData] = await Promise.all([
    getHourlyPatterns(dateParams),
    getDailyPatterns(dateParams),
    getSizeAnalysis(dateParams),
  ]);

  const hasData =
    hourly.some((h) => h.prCount > 0) ||
    daily.some((d) => d.prCount > 0) ||
    sizeData.some((s) => s.prCount > 0);

  if (!hasData) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">핵심 통계</h1>
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="통계 데이터를 준비 중입니다"
          description="PR 데이터가 충분히 수집되면 시간대별, 요일별, PR 크기별 통계를 확인할 수 있습니다."
        />
      </div>
    );
  }

  // Find best hour and best day
  const activeHours = hourly.filter((h) => h.prCount > 0);
  const bestHour = activeHours.length > 0
    ? activeHours.reduce((min, h) => (h.avgMergeTimeMs < min.avgMergeTimeMs ? h : min))
    : null;

  const activeDays = daily.filter((d) => d.prCount > 0);
  const bestDay = activeDays.length > 0
    ? activeDays.reduce((min, d) => (d.avgMergeTimeMs < min.avgMergeTimeMs ? d : min))
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">핵심 통계</h1>
        <div className="flex gap-1 rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {[
            { value: "7d", label: "7일" },
            { value: "30d", label: "30일" },
            { value: "90d", label: "90일" },
          ].map((p) => (
            <a
              key={p.value}
              href={`/${orgSlug}/stats?period=${p.value}`}
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

      {/* Insights */}
      {(bestHour || bestDay) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {bestHour && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
              <p className="text-sm text-gray-400 mb-1">가장 빠른 머지 시간대</p>
              <p className="text-2xl font-bold text-green-400">
                오전 {bestHour.hour}시 - {bestHour.hour + 1}시
              </p>
              <p className="text-xs text-gray-500 mt-1">
                이 시간대에 올린 PR이 가장 빨리 머지됩니다
              </p>
            </div>
          )}
          {bestDay && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
              <p className="text-sm text-gray-400 mb-1">가장 빠른 머지 요일</p>
              <p className="text-2xl font-bold text-amber-400">{bestDay.dayName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {bestDay.dayName}에 올린 PR이 가장 빨리 처리됩니다
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyHeatmap data={hourly} />
        <MergeTimeByDayChart data={daily} />
        <PrSizeChart data={sizeData} />
      </div>
    </div>
  );
}

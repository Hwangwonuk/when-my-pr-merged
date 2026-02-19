"use client";

import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import type { HourlyPattern } from "@/types";

interface HourlyHeatmapProps {
  data: HourlyPattern[];
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const maxTime = Math.max(...data.filter((d) => d.prCount > 0).map((d) => d.avgMergeTimeMs), 1);

  function getColor(avgMs: number, prCount: number): string {
    if (prCount === 0) return "bg-gray-800";
    const ratio = avgMs / maxTime;
    if (ratio < 0.25) return "bg-green-500/80";
    if (ratio < 0.5) return "bg-green-400/60";
    if (ratio < 0.75) return "bg-amber-400/60";
    return "bg-red-400/60";
  }

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold mb-2">시간대별 머지 속도</h3>
      <p className="text-xs text-gray-400 mb-4">
        초록색이 빠름, 빨간색이 느림
      </p>
      <div className="grid grid-cols-12 gap-1">
        {data.map((d) => (
          <div
            key={d.hour}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium cursor-default transition-colors",
              getColor(d.avgMergeTimeMs, d.prCount)
            )}
            title={
              d.prCount > 0
                ? `${d.hour}시: ${formatDuration(d.avgMergeTimeMs)} (${d.prCount}개 PR)`
                : `${d.hour}시: 데이터 없음`
            }
          >
            {d.hour}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>빠름</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-3 rounded-sm bg-green-500/80" />
          <div className="w-4 h-3 rounded-sm bg-green-400/60" />
          <div className="w-4 h-3 rounded-sm bg-amber-400/60" />
          <div className="w-4 h-3 rounded-sm bg-red-400/60" />
        </div>
        <span>느림</span>
      </div>
    </div>
  );
}

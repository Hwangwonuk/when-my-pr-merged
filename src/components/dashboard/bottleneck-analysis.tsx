"use client";

import { formatDuration } from "@/lib/utils/format";
import type { BottleneckAnalysis } from "@/types";

interface BottleneckAnalysisProps {
  data: BottleneckAnalysis;
}

export function BottleneckAnalysisView({ data }: BottleneckAnalysisProps) {
  const stages = [
    {
      label: "PR 오픈 → 첫 리뷰",
      duration: data.avgTimeToFirstReviewMs,
    },
    {
      label: "첫 리뷰 → 승인",
      duration: data.avgFirstReviewToApprovalMs,
    },
    {
      label: "승인 → 머지",
      duration: data.avgApprovalToMergeMs,
    },
  ];

  const maxDuration = Math.max(...stages.map((s) => s.duration), 1);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-1">병목 지점 분석</h3>
      <p className="text-xs text-gray-600 mb-5">
        PR이 머지되기까지 각 단계별 평균 소요 시간
      </p>

      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">{stage.label}</span>
              <span className="text-xs font-medium tabular-nums text-white">
                {stage.duration > 0 ? formatDuration(stage.duration) : "-"}
              </span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((stage.duration / maxDuration) * 100, 2)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-800/50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">총 평균 소요 시간</span>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-white">
            {formatDuration(data.avgTotalMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

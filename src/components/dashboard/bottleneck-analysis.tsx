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
      color: "bg-amber-400",
    },
    {
      label: "첫 리뷰 → 승인",
      duration: data.avgFirstReviewToApprovalMs,
      color: "bg-blue-400",
    },
    {
      label: "승인 → 머지",
      duration: data.avgApprovalToMergeMs,
      color: "bg-green-400",
    },
  ];

  const maxDuration = Math.max(...stages.map((s) => s.duration), 1);

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold mb-2">병목 지점 분석</h3>
      <p className="text-xs text-gray-400 mb-6">
        PR이 머지되기까지 각 단계별 평균 소요 시간
      </p>

      <div className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">{stage.label}</span>
              <span className="text-sm font-medium text-white">
                {formatDuration(stage.duration)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                style={{
                  width: `${Math.max((stage.duration / maxDuration) * 100, 2)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">총 평균 소요 시간</span>
          <span className="text-lg font-bold text-white">
            {formatDuration(data.avgTotalMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

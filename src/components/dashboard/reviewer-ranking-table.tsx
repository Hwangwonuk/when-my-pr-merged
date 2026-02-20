"use client";

import { formatDuration, formatPercentage } from "@/lib/utils/format";
import { RankBadge } from "@/components/shared/rank-badge";
import type { ReviewerRanking } from "@/types";

interface ReviewerRankingTableProps {
  rankings: ReviewerRanking[];
}

export function ReviewerRankingTable({ rankings }: ReviewerRankingTableProps) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800/50">
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">#</th>
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">리뷰어</th>
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">평균 응답 시간</th>
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">리뷰 수</th>
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">승인율</th>
            <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">등급</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((reviewer) => (
            <tr
              key={reviewer.user.id}
              className="border-b border-gray-800/30 hover:bg-gray-800/40 hover:-translate-y-px transition-all duration-200"
            >
              <td className="px-3 py-2.5">
                <RankBadge rank={reviewer.rank} />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {reviewer.user.avatarUrl && (
                    <img
                      src={reviewer.user.avatarUrl}
                      alt={reviewer.user.login}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-white text-[13px]">{reviewer.user.login}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-gray-400 tabular-nums text-[13px]">
                {reviewer.avgResponseTimeMs > 0
                  ? formatDuration(reviewer.avgResponseTimeMs)
                  : "N/A"}
              </td>
              <td className="px-3 py-2.5 text-gray-400 tabular-nums text-[13px]">{reviewer.reviewCount}건</td>
              <td className="px-3 py-2.5 text-gray-400 tabular-nums text-[13px]">
                {formatPercentage(reviewer.approvalRate)}
              </td>
              <td className="px-3 py-2.5">
                <span className="text-xs text-gray-500">
                  상위 {100 - reviewer.percentile}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

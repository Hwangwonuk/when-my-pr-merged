"use client";

import { formatDuration, formatPercentage } from "@/lib/utils/format";
import { RankBadge } from "@/components/shared/rank-badge";
import type { ReviewerRanking } from "@/types";

interface ReviewerRankingTableProps {
  rankings: ReviewerRanking[];
}

export function ReviewerRankingTable({ rankings }: ReviewerRankingTableProps) {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">리뷰어</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">평균 응답 시간</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">리뷰 수</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">승인율</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">등급</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((reviewer) => (
            <tr
              key={reviewer.user.id}
              className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
            >
              <td className="px-4 py-3">
                <RankBadge rank={reviewer.rank} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {reviewer.user.avatarUrl && (
                    <img
                      src={reviewer.user.avatarUrl}
                      alt={reviewer.user.login}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-white">{reviewer.user.login}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-300">
                {reviewer.avgResponseTimeMs > 0
                  ? formatDuration(reviewer.avgResponseTimeMs)
                  : "N/A"}
              </td>
              <td className="px-4 py-3 text-gray-300">{reviewer.reviewCount}건</td>
              <td className="px-4 py-3 text-gray-300">
                {formatPercentage(reviewer.approvalRate)}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-400">
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

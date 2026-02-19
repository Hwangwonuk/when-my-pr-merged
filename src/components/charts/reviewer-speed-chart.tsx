"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDuration } from "@/lib/utils/format";
import type { ReviewerRanking } from "@/types";

interface ReviewerSpeedChartProps {
  data: ReviewerRanking[];
}

export function ReviewerSpeedChart({ data }: ReviewerSpeedChartProps) {
  const chartData = data
    .filter((r) => r.avgResponseTimeMs > 0)
    .slice(0, 10)
    .map((r) => ({
      login: r.user.login,
      avgHours: Math.round((r.avgResponseTimeMs / 3_600_000) * 10) / 10,
      reviewCount: r.reviewCount,
    }));

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold mb-4">리뷰어 응답 속도 (Top 10)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} unit="h" />
          <YAxis
            type="category"
            dataKey="login"
            stroke="#9ca3af"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value) => [
              formatDuration(Number(value) * 3_600_000),
              "평균 응답 시간",
            ]}
          />
          <Bar dataKey="avgHours" fill="#818cf8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

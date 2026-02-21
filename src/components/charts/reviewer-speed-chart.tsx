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

  if (chartData.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-4">리뷰어 응답 속도 (Top 10)</h3>
        <div className="flex items-center justify-center h-[300px] text-sm text-gray-500">
          리뷰 요청(Review Request) 데이터가 수집되면 응답 속도를 확인할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-4">리뷰어 응답 속도 (Top 10)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} unit="h" />
          <YAxis
            type="category"
            dataKey="login"
            stroke="#6b7280"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(31,41,55,0.5)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13px",
            }}
            formatter={(value) => [
              formatDuration(Number(value) * 3_600_000),
              "평균 응답 시간",
            ]}
          />
          <Bar dataKey="avgHours" fill="#6366f1" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

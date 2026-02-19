"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatDuration } from "@/lib/utils/format";
import type { SizeAnalysis } from "@/types";

interface PrSizeChartProps {
  data: SizeAnalysis[];
}

const COLORS = ["#34d399", "#60a5fa", "#f59e0b", "#ef4444"];

export function PrSizeChart({ data }: PrSizeChartProps) {
  const chartData = data
    .filter((d) => d.prCount > 0)
    .map((d) => ({
      ...d,
      avgHours: Math.round((d.avgMergeTimeMs / 3_600_000) * 10) / 10,
    }));

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold mb-4">PR 크기별 머지 시간</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} unit="h" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value) => [
              formatDuration(Number(value) * 3_600_000),
              "평균 머지 시간",
            ]}
          />
          <Bar dataKey="avgHours" radius={[4, 4, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-400 text-center">
        PR 크기가 작을수록 머지가 빠릅니다
      </div>
    </div>
  );
}

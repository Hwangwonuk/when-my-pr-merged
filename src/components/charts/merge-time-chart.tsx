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
import { formatDuration, getDayNameKo } from "@/lib/utils/format";
import type { DailyPattern } from "@/types";

interface MergeTimeChartProps {
  data: DailyPattern[];
}

export function MergeTimeByDayChart({ data }: MergeTimeChartProps) {
  const chartData = data
    .filter((d) => d.prCount > 0)
    .map((d) => ({
      ...d,
      label: getDayNameKo(d.dayOfWeek).replace("요일", ""),
      avgHours: Math.round(d.avgMergeTimeMs / 3_600_000 * 10) / 10,
    }));

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold mb-4">요일별 평균 머지 시간</h3>
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
            labelFormatter={(label) => `${label}요일`}
          />
          <Bar dataKey="avgHours" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

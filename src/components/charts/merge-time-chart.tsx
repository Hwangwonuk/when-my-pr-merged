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
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-4">요일별 평균 머지 시간</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} unit="h" />
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
              "평균 머지 시간",
            ]}
            labelFormatter={(label) => `${label}요일`}
          />
          <Bar dataKey="avgHours" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

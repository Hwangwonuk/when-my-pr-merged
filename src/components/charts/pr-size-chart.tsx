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

const INDIGO_GRADIENT = ["#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"];

export function PrSizeChart({ data }: PrSizeChartProps) {
  const filtered = data.filter((d) => d.prCount > 0);
  const maxMs = Math.max(...filtered.map((d) => d.avgMergeTimeMs), 0);
  const useMinutes = maxMs < 3_600_000;
  const divisor = useMinutes ? 60_000 : 3_600_000;
  const unit = useMinutes ? "분" : "h";

  const chartData = filtered.map((d) => ({
    ...d,
    avgTime: Math.round((d.avgMergeTimeMs / divisor) * 10) / 10,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-4">PR 크기별 머지 시간</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} unit={unit} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(31,41,55,0.5)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13px",
            }}
            formatter={(value) => [
              formatDuration(Number(value) * divisor),
              "평균 머지 시간",
            ]}
          />
          <Bar dataKey="avgTime" radius={[3, 3, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={INDIGO_GRADIENT[index % INDIGO_GRADIENT.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-600 text-center">
        PR 크기가 작을수록 머지가 빠릅니다
      </p>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils/cn";

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const periods = [
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "90d", label: "90일" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            value === p.value
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function getDateRange(period: string): { from: string; to: string } {
  const to = new Date().toISOString();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date(Date.now() - days * 86_400_000).toISOString();
  return { from, to };
}

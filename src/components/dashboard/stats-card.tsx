import { cn } from "@/lib/utils/cn";

type AccentColor = "indigo" | "emerald" | "amber" | "rose" | "sky";

const accentStyles: Record<AccentColor, string> = {
  indigo: "border-l-indigo-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  rose: "border-l-rose-500",
  sky: "border-l-sky-500",
};

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  color?: AccentColor;
  className?: string;
}

export function StatsCard({ title, value, subtitle, trend, color = "indigo", className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl bg-gray-800/50 border border-gray-700/50 border-l-4 p-6", accentStyles[color], className)}>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {trend !== undefined && (
        <p
          className={cn(
            "text-xs mt-2",
            trend > 0 ? "text-red-400" : trend < 0 ? "text-green-400" : "text-gray-500"
          )}
        >
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}{" "}
          {Math.abs(trend).toFixed(1)}% vs 이전 기간
        </p>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  className?: string;
}

export function StatsCard({ title, value, subtitle, trend, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl bg-gray-800/50 border border-gray-700/50 p-6", className)}>
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

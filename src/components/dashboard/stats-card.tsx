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
    <div className={cn("py-1", className)}>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <span
            className={cn(
              "text-xs tabular-nums",
              trend < 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

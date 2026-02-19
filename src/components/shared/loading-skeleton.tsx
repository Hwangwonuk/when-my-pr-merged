import { cn } from "@/lib/utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-800 rounded-lg", className)} />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6 space-y-3">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-8 w-32" />
      <LoadingSkeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

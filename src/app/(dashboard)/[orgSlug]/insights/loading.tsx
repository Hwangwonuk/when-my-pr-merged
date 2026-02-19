import { LoadingSkeleton, StatsCardSkeleton } from "@/components/shared/loading-skeleton";

export default function InsightsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-28 animate-pulse bg-gray-800 rounded-lg" />
        <div className="h-9 w-48 animate-pulse bg-gray-800 rounded-lg" />
      </div>
      <div className="space-y-6">
        <LoadingSkeleton className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <LoadingSkeleton className="h-40" />
      </div>
    </div>
  );
}

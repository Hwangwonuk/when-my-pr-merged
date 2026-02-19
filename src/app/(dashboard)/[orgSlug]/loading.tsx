import { StatsCardSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";

export default function OrgDashboardLoading() {
  return (
    <div>
      <div className="h-8 w-48 animate-pulse bg-gray-800 rounded-lg mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
        <div className="h-6 w-40 animate-pulse bg-gray-800 rounded mb-4" />
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}

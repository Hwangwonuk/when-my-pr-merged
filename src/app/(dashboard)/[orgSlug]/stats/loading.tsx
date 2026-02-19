import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function StatsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-32 animate-pulse bg-gray-800 rounded-lg" />
        <div className="h-9 w-48 animate-pulse bg-gray-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <LoadingSkeleton className="h-40" />
        <LoadingSkeleton className="h-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton className="h-64" />
        <LoadingSkeleton className="h-64" />
        <LoadingSkeleton className="h-64" />
      </div>
    </div>
  );
}

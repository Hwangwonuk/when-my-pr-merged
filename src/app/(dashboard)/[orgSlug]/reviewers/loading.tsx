import { LoadingSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";

export default function ReviewersLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-36 animate-pulse bg-gray-800 rounded-lg" />
        <div className="h-9 w-48 animate-pulse bg-gray-800 rounded-lg" />
      </div>
      <div className="space-y-6">
        <LoadingSkeleton className="h-64" />
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <div className="h-6 w-40 animate-pulse bg-gray-800 rounded mb-4" />
          <TableSkeleton rows={8} />
        </div>
      </div>
    </div>
  );
}

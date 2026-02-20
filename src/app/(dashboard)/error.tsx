"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="mb-4 flex justify-center text-amber-400">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-bold mb-2">데이터를 불러올 수 없습니다</h2>
      <p className="text-gray-400 mb-6">
        대시보드 데이터를 불러오는 중 오류가 발생했습니다.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}

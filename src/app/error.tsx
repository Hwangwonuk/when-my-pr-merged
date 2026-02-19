"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">😵</div>
        <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>
        <p className="text-gray-400 mb-6">
          예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

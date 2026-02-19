import { formatDuration, formatRelativeTime } from "@/lib/utils/format";

interface PredictionItem {
  pr: {
    number: number;
    title: string;
    authorLogin: string;
    createdAt: string;
  };
  predictedMergeAt: string;
  confidenceLevel: "low" | "medium" | "high";
}

interface PredictionWidgetProps {
  predictions: PredictionItem[];
}

const confidenceBadge = {
  high: { label: "높음", className: "bg-green-900/30 text-green-400" },
  medium: { label: "보통", className: "bg-yellow-900/30 text-yellow-400" },
  low: { label: "낮음", className: "bg-gray-700/30 text-gray-400" },
};

export function PredictionWidget({ predictions }: PredictionWidgetProps) {
  if (predictions.length === 0) return null;

  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
      <h2 className="text-lg font-semibold mb-4">머지 예측</h2>
      <div className="space-y-3">
        {predictions.map((item) => {
          const predictedAt = new Date(item.predictedMergeAt);
          const now = new Date();
          const remainingMs = predictedAt.getTime() - now.getTime();
          const badge = confidenceBadge[item.confidenceLevel];

          return (
            <div
              key={item.pr.number}
              className="flex items-center gap-4 rounded-lg bg-gray-700/20 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  #{item.pr.number} {item.pr.title}
                </p>
                <p className="text-xs text-gray-500">
                  {item.pr.authorLogin} · {formatRelativeTime(new Date(item.pr.createdAt))}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-indigo-400">
                  {remainingMs > 0
                    ? `~${formatDuration(remainingMs)} 후`
                    : "곧 머지 예상"}
                </p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}
                >
                  신뢰도 {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

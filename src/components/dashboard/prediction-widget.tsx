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
  high: { label: "높음", className: "text-green-400" },
  medium: { label: "보통", className: "text-gray-400" },
  low: { label: "낮음", className: "text-gray-600" },
};

export function PredictionWidget({ predictions }: PredictionWidgetProps) {
  if (predictions.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-300 mb-3">머지 예측</h2>
      <div className="space-y-0">
        {predictions.map((item) => {
          const predictedAt = new Date(item.predictedMergeAt);
          const now = new Date();
          const remainingMs = predictedAt.getTime() - now.getTime();
          const badge = confidenceBadge[item.confidenceLevel];

          return (
            <div
              key={item.pr.number}
              className="flex items-center gap-4 px-3 py-2.5 -mx-3 rounded-md hover:bg-gray-800/40 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  #{item.pr.number} {item.pr.title}
                </p>
                <p className="text-xs text-gray-600">
                  {item.pr.authorLogin} · {formatRelativeTime(new Date(item.pr.createdAt))}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm tabular-nums text-indigo-400">
                  {remainingMs > 0
                    ? `~${formatDuration(remainingMs)} 후`
                    : "곧 머지 예상"}
                </p>
                <span className={`text-xs ${badge.className}`}>
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

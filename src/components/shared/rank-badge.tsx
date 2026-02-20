import { cn } from "@/lib/utils/cn";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md";
}

const podiumStyles: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  2: "bg-gray-400/20 text-gray-300 border border-gray-400/30",
  3: "bg-amber-700/20 text-amber-500 border border-amber-700/30",
};

export function RankBadge({ rank, size = "sm" }: RankBadgeProps) {
  const isPodium = rank >= 1 && rank <= 3;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        isPodium
          ? podiumStyles[rank]
          : "text-gray-500",
        size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
      )}
    >
      {rank}
    </span>
  );
}

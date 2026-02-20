export const STALE_PR_DEFAULT_HOURS = 24;
export const HOT_STREAK_THRESHOLD_MS = 3_600_000; // 1 hour
export const HOT_STREAK_COUNT = 3;
export const FAST_REVIEW_THRESHOLD_MS = 1_800_000; // 30 minutes
export const HISTORY_SYNC_DAYS = 90;

export const PR_SIZE_BUCKETS = {
  S: { min: 0, max: 100, label: "S (1-100줄)" },
  M: { min: 101, max: 300, label: "M (101-300줄)" },
  L: { min: 301, max: 500, label: "L (301-500줄)" },
  XL: { min: 501, max: Infinity, label: "XL (500줄+)" },
} as const;

export const BADGE_SLUGS = {
  REVIEW_KING: "review-king",
  LIGHTNING_REVIEWER: "lightning-reviewer",
  STREAK_MASTER: "streak-master",
  MOST_HELPFUL: "most-helpful",
  FASTEST_APPROVER: "fastest-approver",
  SMALL_PR_CHAMPION: "small-pr-champion",
  CONSISTENCY_STAR: "consistency-star",
} as const;

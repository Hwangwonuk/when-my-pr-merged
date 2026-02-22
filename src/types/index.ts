// ─── Stats Types ────────────────────────────────────────────────────

export interface OverviewStats {
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  closedPRs: number;
  avgTimeToFirstReviewMs: number;
  avgTimeToMergeMs: number;
  medianTimeToMergeMs: number;
  avgRevisionCount: number;
  mergeRate: number;
  trend: {
    timeToMerge: number;
    timeToFirstReview: number;
  };
}

export interface ReviewerRanking {
  user: {
    id: string;
    login: string;
    avatarUrl: string | null;
    name: string | null;
  };
  avgResponseTimeMs: number;
  reviewCount: number;
  approvalRate: number;
  rank: number;
  percentile: number;
}

export interface HourlyPattern {
  hour: number;
  avgMergeTimeMs: number;
  prCount: number;
}

export interface DailyPattern {
  dayOfWeek: number;
  dayName: string;
  avgMergeTimeMs: number;
  prCount: number;
}

export interface SizeAnalysis {
  bucket: "S" | "M" | "L" | "XL";
  label: string;
  avgMergeTimeMs: number;
  medianMergeTimeMs: number;
  prCount: number;
}

export interface BottleneckAnalysis {
  avgTimeToFirstReviewMs: number;
  avgFirstReviewToApprovalMs: number;
  avgApprovalToMergeMs: number;
  avgTotalMs: number;
}

export interface PersonalStats {
  user: {
    id: string;
    login: string;
    avatarUrl: string | null;
    name: string | null;
  };
  asAuthor: {
    totalPRs: number;
    mergedPRs: number;
    avgMergeTimeMs: number;
    avgRevisionCount: number;
  };
  asReviewer: {
    totalReviews: number;
    avgResponseTimeMs: number;
    approvalRate: number;
    percentile: number;
  };
  badges: Array<{
    slug: string;
    name: string;
    tier: string;
    awardedAt: string;
    period: string | null;
  }>;
}

export interface MergePrediction {
  predictedMergeAt: string;
  confidenceLevel: "low" | "medium" | "high";
  factors: {
    authorHistory: number;
    reviewerWorkload: number;
    prSize: number;
    dayOfWeek: number;
    hourOfDay: number;
  };
}

export interface ConflictPatternAnalysis {
  totalPRs: number;
  conflictPRs: number;
  conflictRate: number;
  avgResolutionTimeMs: number;
  byDay: Array<{
    dayOfWeek: number;
    dayName: string;
    conflictRate: number;
    conflictCount: number;
    totalCount: number;
  }>;
  byHour: Array<{
    hour: number;
    conflictRate: number;
    conflictCount: number;
    totalCount: number;
  }>;
  bySize: Array<{
    bucket: string;
    conflictRate: number;
    conflictCount: number;
    totalCount: number;
  }>;
}

// ─── API Common Types ───────────────────────────────────────────────

export interface DateRangeParams {
  from: string;
  to: string;
  installationId: string;
  repositoryId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    from: string;
    to: string;
    totalCount: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
}

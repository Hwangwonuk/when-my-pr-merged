import { describe, it, expect } from "vitest";
import {
  STALE_PR_DEFAULT_HOURS,
  HOT_STREAK_THRESHOLD_MS,
  HOT_STREAK_COUNT,
  FAST_REVIEW_THRESHOLD_MS,
  HISTORY_SYNC_DAYS,
  PR_SIZE_BUCKETS,
  BADGE_SLUGS,
} from "@/lib/utils/constants";

describe("constants", () => {
  it("has correct default thresholds", () => {
    expect(STALE_PR_DEFAULT_HOURS).toBe(24);
    expect(HOT_STREAK_THRESHOLD_MS).toBe(3_600_000);
    expect(HOT_STREAK_COUNT).toBe(3);
    expect(FAST_REVIEW_THRESHOLD_MS).toBe(1_800_000);
    expect(HISTORY_SYNC_DAYS).toBe(90);
  });

  it("has valid PR size buckets", () => {
    expect(PR_SIZE_BUCKETS.S.min).toBe(0);
    expect(PR_SIZE_BUCKETS.S.max).toBe(100);
    expect(PR_SIZE_BUCKETS.M.min).toBe(101);
    expect(PR_SIZE_BUCKETS.M.max).toBe(300);
    expect(PR_SIZE_BUCKETS.L.min).toBe(301);
    expect(PR_SIZE_BUCKETS.L.max).toBe(500);
    expect(PR_SIZE_BUCKETS.XL.min).toBe(501);
    expect(PR_SIZE_BUCKETS.XL.max).toBe(Infinity);
  });

  it("size buckets are contiguous with no gaps", () => {
    expect(PR_SIZE_BUCKETS.M.min).toBe(PR_SIZE_BUCKETS.S.max + 1);
    expect(PR_SIZE_BUCKETS.L.min).toBe(PR_SIZE_BUCKETS.M.max + 1);
    expect(PR_SIZE_BUCKETS.XL.min).toBe(PR_SIZE_BUCKETS.L.max + 1);
  });

  it("has all expected badge slugs", () => {
    expect(BADGE_SLUGS.REVIEW_KING).toBe("review-king");
    expect(BADGE_SLUGS.LIGHTNING_REVIEWER).toBe("lightning-reviewer");
    expect(BADGE_SLUGS.STREAK_MASTER).toBe("streak-master");
    expect(BADGE_SLUGS.MOST_HELPFUL).toBe("most-helpful");
    expect(BADGE_SLUGS.FASTEST_APPROVER).toBe("fastest-approver");
  });
});

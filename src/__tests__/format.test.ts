import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  getDayNameKo,
  getPrSizeBucket,
  getHourKST,
  getDayOfWeekKST,
} from "@/lib/utils/format";

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(30_000)).toBe("30초");
  });

  it("formats minutes", () => {
    expect(formatDuration(120_000)).toBe("2분");
  });

  it("formats hours", () => {
    expect(formatDuration(3_600_000)).toBe("1시간");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(5_400_000)).toBe("1시간 30분");
  });

  it("formats days", () => {
    expect(formatDuration(86_400_000)).toBe("1일");
  });

  it("formats days and hours", () => {
    expect(formatDuration(90_000_000)).toBe("1일 1시간");
  });
});

describe("formatNumber", () => {
  it("formats small numbers", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("formats large numbers with comma", () => {
    expect(formatNumber(1234)).toBe("1,234");
  });
});

describe("formatPercentage", () => {
  it("formats with default decimal", () => {
    expect(formatPercentage(85.5)).toBe("85.5%");
  });

  it("formats with zero decimals", () => {
    expect(formatPercentage(85.5, 0)).toBe("86%");
  });
});

describe("getDayNameKo", () => {
  it("returns correct day names", () => {
    expect(getDayNameKo(0)).toBe("일요일");
    expect(getDayNameKo(1)).toBe("월요일");
    expect(getDayNameKo(6)).toBe("토요일");
  });

  it("returns empty for invalid index", () => {
    expect(getDayNameKo(7)).toBe("");
  });
});

describe("getPrSizeBucket", () => {
  it("returns S for small PRs", () => {
    expect(getPrSizeBucket(50, 30)).toBe("S");
  });

  it("returns M for medium PRs", () => {
    expect(getPrSizeBucket(150, 100)).toBe("M");
  });

  it("returns L for large PRs", () => {
    expect(getPrSizeBucket(300, 150)).toBe("L");
  });

  it("returns XL for extra large PRs", () => {
    expect(getPrSizeBucket(400, 200)).toBe("XL");
  });
});

describe("getHourKST", () => {
  it("converts UTC 00:00 to KST 9", () => {
    const date = new Date("2025-01-15T00:00:00Z");
    expect(getHourKST(date)).toBe(9);
  });

  it("converts UTC 15:00 to KST 0 (midnight)", () => {
    const date = new Date("2025-01-15T15:00:00Z");
    expect(getHourKST(date)).toBe(0);
  });

  it("converts UTC 05:00 to KST 14", () => {
    const date = new Date("2025-01-15T05:00:00Z");
    expect(getHourKST(date)).toBe(14);
  });
});

describe("getDayOfWeekKST", () => {
  it("returns correct day for KST", () => {
    // 2025-01-15 is Wednesday
    const date = new Date("2025-01-15T12:00:00Z");
    expect(getDayOfWeekKST(date)).toBe(3); // Wed
  });

  it("handles date boundary crossing (Saturday UTC → Sunday KST)", () => {
    // Saturday 2025-01-18 23:00 UTC = Sunday 2025-01-19 08:00 KST
    const date = new Date("2025-01-18T23:00:00Z");
    expect(getDayOfWeekKST(date)).toBe(0); // Sunday in KST
  });
});

describe("formatRelativeTime", () => {
  it("formats just now", () => {
    expect(formatRelativeTime(new Date())).toBe("방금 전");
  });

  it("formats minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinAgo)).toBe("5분 전");
  });

  it("formats hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000);
    expect(formatRelativeTime(threeHoursAgo)).toBe("3시간 전");
  });
});

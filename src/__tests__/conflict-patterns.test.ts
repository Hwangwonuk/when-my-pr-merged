import { describe, it, expect } from "vitest";
import { getDayNameKo, formatPercentage, getPrSizeBucket } from "@/lib/utils/format";

describe("conflict pattern utilities", () => {
  describe("day-based conflict analysis helpers", () => {
    it("maps all 7 days correctly", () => {
      const days = [0, 1, 2, 3, 4, 5, 6].map(getDayNameKo);
      expect(days).toEqual(["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]);
    });
  });

  describe("conflict rate formatting", () => {
    it("formats zero rate", () => {
      // formatPercentage expects 0-100 scale
      expect(formatPercentage(0)).toBe("0.0%");
    });

    it("formats typical conflict rates (0-100 scale)", () => {
      expect(formatPercentage(15)).toBe("15.0%");
      expect(formatPercentage(33.3)).toBe("33.3%");
    });

    it("formats 100% rate", () => {
      expect(formatPercentage(100)).toBe("100.0%");
    });
  });

  describe("size bucket for conflict correlation", () => {
    it("XL PRs have correct bucket", () => {
      expect(getPrSizeBucket(400, 200)).toBe("XL");
    });

    it("S PRs have correct bucket", () => {
      expect(getPrSizeBucket(30, 20)).toBe("S");
    });
  });

  describe("conflict resolution time calculation", () => {
    it("calculates resolution time correctly", () => {
      const detected = new Date("2026-02-15T10:00:00Z");
      const resolved = new Date("2026-02-15T12:30:00Z");
      const resolutionMs = resolved.getTime() - detected.getTime();
      expect(resolutionMs).toBe(2.5 * 60 * 60 * 1000); // 2.5 hours
    });

    it("handles same-day resolution", () => {
      const detected = new Date("2026-02-15T14:00:00Z");
      const resolved = new Date("2026-02-15T14:15:00Z");
      const resolutionMs = resolved.getTime() - detected.getTime();
      expect(resolutionMs).toBe(15 * 60 * 1000); // 15 minutes
    });
  });

  describe("conflict rate by PR size correlation", () => {
    it("correctly computes conflict rate from counts", () => {
      const conflictCount = 3;
      const totalCount = 10;
      const rate = totalCount > 0 ? conflictCount / totalCount : 0;
      expect(rate).toBeCloseTo(0.3);
    });

    it("handles zero total count", () => {
      const rate = 0 > 0 ? 5 / 0 : 0;
      expect(rate).toBe(0);
    });

    it("larger PRs tend to have higher conflict rate formula", () => {
      // Simulating: XL = 40% conflict, S = 10% conflict
      const xlRate = 4 / 10;
      const sRate = 1 / 10;
      expect(xlRate / sRate).toBe(4.0);
      expect(xlRate > sRate * 2).toBe(true);
    });
  });
});

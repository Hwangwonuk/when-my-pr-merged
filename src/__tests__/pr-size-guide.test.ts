import { describe, it, expect } from "vitest";
import { getPrSizeLabel, getPrSizeBucket } from "@/lib/utils/format";
import { slackMessages } from "@/lib/slack/messages";

describe("PR size classification", () => {
  describe("getPrSizeLabel", () => {
    it("classifies tiny PRs as S", () => {
      expect(getPrSizeLabel(10, 5)).toBe("S (1-100줄)");
    });

    it("classifies boundary 100 as S", () => {
      expect(getPrSizeLabel(60, 40)).toBe("S (1-100줄)");
    });

    it("classifies 101 as M", () => {
      expect(getPrSizeLabel(70, 31)).toBe("M (101-300줄)");
    });

    it("classifies 500 as L", () => {
      expect(getPrSizeLabel(300, 200)).toBe("L (301-500줄)");
    });

    it("classifies 501+ as XL", () => {
      expect(getPrSizeLabel(400, 200)).toBe("XL (500줄+)");
    });
  });

  describe("getPrSizeBucket", () => {
    it("returns correct bucket for each range", () => {
      expect(getPrSizeBucket(0, 0)).toBe("S");
      expect(getPrSizeBucket(50, 50)).toBe("S");
      expect(getPrSizeBucket(100, 1)).toBe("M");
      expect(getPrSizeBucket(200, 100)).toBe("M");
      expect(getPrSizeBucket(200, 101)).toBe("L");
      expect(getPrSizeBucket(300, 201)).toBe("XL");
    });
  });

  describe("prSizeGuide message", () => {
    it("small PR gets encouraging message", () => {
      const msg = slackMessages.prSizeGuide(50);
      expect(msg).toContain("white_check_mark");
      expect(msg).toContain("50줄");
    });

    it("medium PR gets gentle suggestion", () => {
      const msg = slackMessages.prSizeGuide(250);
      expect(msg).toContain("large_yellow_circle");
      expect(msg).toContain("250줄");
      expect(msg).toContain("나눠보세요");
    });

    it("large PR gets warning", () => {
      const msg = slackMessages.prSizeGuide(800);
      expect(msg).toContain("red_circle");
      expect(msg).toContain("800줄");
    });

    it("boundary at 100 is small", () => {
      expect(slackMessages.prSizeGuide(100)).toContain("white_check_mark");
    });

    it("boundary at 101 is medium", () => {
      expect(slackMessages.prSizeGuide(101)).toContain("large_yellow_circle");
    });

    it("boundary at 300 is medium", () => {
      expect(slackMessages.prSizeGuide(300)).toContain("large_yellow_circle");
    });

    it("boundary at 301 is large", () => {
      expect(slackMessages.prSizeGuide(301)).toContain("red_circle");
    });
  });
});

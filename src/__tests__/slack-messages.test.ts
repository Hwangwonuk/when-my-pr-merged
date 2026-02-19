import { describe, it, expect } from "vitest";
import { slackMessages } from "@/lib/slack/messages";

describe("slackMessages", () => {
  describe("stalePrAlert", () => {
    it("includes PR number and hours", () => {
      const result = slackMessages.stalePrAlert({
        title: "Fix bug",
        number: 42,
        url: "https://github.com/org/repo/pull/42",
        hours: 24,
        author: "testuser",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (result.blocks[0] as any).text.text as string;
      expect(text).toContain("#42");
      expect(text).toContain("24시간");
      expect(text).toContain("testuser");
    });
  });

  describe("hotStreak", () => {
    it("includes user and count", () => {
      const result = slackMessages.hotStreak({
        user: "speedster",
        count: 5,
      });

      const text = result.blocks[0].text.text;
      expect(text).toContain("speedster");
      expect(text).toContain("5개");
    });
  });

  describe("fastReviewPraise", () => {
    it("includes reviewer name and formatted time", () => {
      const result = slackMessages.fastReviewPraise({
        reviewer: "fastreviewer",
        responseTimeMs: 600_000, // 10 minutes
      });

      const text = result.blocks[0].text.text;
      expect(text).toContain("fastreviewer");
      expect(text).toContain("10분");
    });
  });

  describe("prSizeGuide", () => {
    it("returns green for small PRs", () => {
      const result = slackMessages.prSizeGuide(50);
      expect(result).toContain("white_check_mark");
      expect(result).toContain("50줄");
    });

    it("returns yellow for medium PRs", () => {
      const result = slackMessages.prSizeGuide(200);
      expect(result).toContain("large_yellow_circle");
    });

    it("returns red for large PRs", () => {
      const result = slackMessages.prSizeGuide(500);
      expect(result).toContain("red_circle");
    });
  });

  describe("weeklyReport", () => {
    it("includes all stats fields", () => {
      const result = slackMessages.weeklyReport({
        orgName: "test-org",
        totalPRs: 42,
        mergedPRs: 35,
        avgMergeTime: "3시간",
        avgFirstReviewTime: "1시간",
        topReviewer: "reviewer1",
        topReviewerCount: 15,
        period: "2026-W07",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headerText = (result.blocks[0] as any).text.text as string;
      expect(headerText).toContain("test-org");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields = (result.blocks[1] as any).fields as Array<{ text: string }>;
      expect(fields[0].text).toContain("42개");
      expect(fields[1].text).toContain("35개");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trophyText = (result.blocks[2] as any).text.text as string;
      expect(trophyText).toContain("reviewer1");
    });
  });
});

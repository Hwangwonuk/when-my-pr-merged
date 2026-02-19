import { test, expect } from "@playwright/test";

test.describe("API 헬스 체크", () => {
  test("OAuth 엔드포인트는 GitHub로 리다이렉트", async ({ request }) => {
    const res = await request.get("/api/auth/github", {
      maxRedirects: 0,
    });
    // OAuth 시작은 GitHub로 리다이렉트
    expect([301, 302, 307, 308]).toContain(res.status());
  });

  test("크론 엔드포인트 - 인증 없이 접근", async ({ request }) => {
    const res = await request.get("/api/cron/stale-prs");
    // 크론 시크릿 없이 접근 시 401 또는 동작
    expect(res.status()).toBeLessThan(500);
  });

  test("Slack 커맨드 - POST 필요", async ({ request }) => {
    const res = await request.post("/api/slack/commands", {
      data: "",
    });
    // 서명 검증 실패로 401 예상
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

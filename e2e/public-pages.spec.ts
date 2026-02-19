import { test, expect } from "@playwright/test";

test.describe("공개 페이지", () => {
  test("로그인 페이지 접근 가능", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);
  });

  test("공유 페이지 접근 가능 (존재하지 않는 카드)", async ({ page }) => {
    const res = await page.goto("/share/user-nonexistent");
    expect(res?.status()).toBe(200);
    // 존재하지 않는 유저면 "찾을 수 없습니다" 표시
    await expect(page.locator("text=찾을 수 없습니다")).toBeVisible();
  });

  test("404 페이지", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-at-all");
    // Next.js는 not-found에 대해 404를 반환
    expect(res?.status()).toBe(404);
  });

  test("웹훅 엔드포인트 - POST만 허용", async ({ request }) => {
    const res = await request.get("/api/webhooks/github");
    // GET은 405 또는 다른 에러 코드
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

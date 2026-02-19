import { test, expect } from "@playwright/test";

test.describe("인증 흐름", () => {
  test("비로그인 사용자는 /login으로 리다이렉트", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=GitHub로 로그인")).toBeVisible();
  });

  test("보호된 API는 401 반환", async ({ request }) => {
    const res = await request.get("/api/stats/overview?installationId=test&from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z");
    expect(res.status()).toBe(401);
  });
});

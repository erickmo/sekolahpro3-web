import { test, expect } from "@playwright/test";

test("school login -> home -> logout", async ({ page, context }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', process.env.E2E_USER ?? "Administrator");
  await page.fill('input[type="password"]', process.env.E2E_PASS ?? "admin");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Beranda")).toBeVisible();

  await context.clearCookies();
  await page.reload();
  await expect(page.getByText("Login")).toBeVisible();
});

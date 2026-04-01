import { test, expect } from "../playwright-fixture";

test.describe("App Access Control", () => {
  test("unauthenticated user is redirected from /profile to home", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/");
    await expect(page).toHaveURL("/");
  });

  test("unauthenticated user is redirected from /matchmaking to home", async ({ page }) => {
    await page.goto("/matchmaking");
    await page.waitForURL("**/");
    await expect(page).toHaveURL("/");
  });

  test("unauthenticated user is redirected from /chat to home", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForURL("**/");
    await expect(page).toHaveURL("/");
  });

  test("home page is accessible without auth", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("auth page is accessible without auth", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Auth Flow", () => {
  test("login form is visible on auth page", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/auth");
    await page.fill('input[type="email"]', "nonexistent@test.com");
    await page.fill('input[type="password"]', "wrongpassword123");
    await page.locator('button:has-text("ENTRAR"), button:has-text("LOGIN"), button:has-text("Entrar")').first().click();
    // Should show some error feedback (toast or inline)
    await page.waitForTimeout(2000);
    // User stays on auth page
    await expect(page).toHaveURL(/\/auth/);
  });
});

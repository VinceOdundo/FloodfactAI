import { test, expect } from "@playwright/test";

/**
 * Exercises real Supabase Auth (app/login/login-form.tsx), not the
 * DEMO_MODE role-switcher every other e2e spec uses. Only meaningful
 * against a server actually running with DEMO_MODE=false and a real
 * Supabase project — the standard CI run forces DEMO_MODE=true (see
 * playwright.config.ts), so this test skips itself there instead of
 * failing. To run it for real: provision a staff account (see
 * docs/SETUP.md, "Provisioning staff accounts") and pass its credentials
 * as E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD — never commit real values for
 * these.
 */
test("admin can sign in with real Supabase Auth credentials", async ({ page }) => {
  await page.goto("/login");

  const emailField = page.getByLabel("Email");
  const isRealLoginForm = await emailField.isVisible().catch(() => false);
  test.skip(!isRealLoginForm, "Server is in DEMO_MODE — the real-auth login form isn't rendered.");
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to exercise this against a real Supabase project."
  );

  await emailField.fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  await expect(page.getByText("Mission Control")).toBeVisible();
});

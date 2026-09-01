import { test, expect } from "@playwright/test";

const SHOT_DIR = "docs/submission/screenshots";

test.describe("public site", () => {
  test("landing page tells the story", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /flood warnings people can trust/i })).toBeVisible();
    await page.screenshot({ path: `${SHOT_DIR}/01-landing.png`, fullPage: true });
  });

  test("resident can submit a report", async ({ page }) => {
    await page.goto("/report");
    await page.getByLabel(/what are you seeing or hearing/i).fill("Water is rising fast near the railway crossing on Kanini Road");
    await page.getByLabel(/where\?/i).fill("Kanini Road, Mukuru kwa Reuben");
    await page.screenshot({ path: `${SHOT_DIR}/02-report-form.png`, fullPage: true });
    await page.getByRole("button", { name: /submit report/i }).click();
    await expect(page.getByText(/report received/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `${SHOT_DIR}/03-report-confirmed.png`, fullPage: true });
  });

  test("verified alerts feed renders", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: /verified alerts/i })).toBeVisible();
    await page.screenshot({ path: `${SHOT_DIR}/04-alerts-feed.png`, fullPage: true });
  });

  test("blog index and a post render", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: /how the system works/i })).toBeVisible();
    await page.screenshot({ path: `${SHOT_DIR}/13-blog-index.png`, fullPage: true });
  });
});

test.describe("admin mission control (demo mode)", () => {
  test("full admin walkthrough", async ({ page }) => {
    await page.goto("/login");
    await page.screenshot({ path: `${SHOT_DIR}/05-login.png`, fullPage: true });
    await page.getByRole("button", { name: /view as admin/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    // Let the map either finish rendering tiles or fall back to the status
    // list (components/admin/live-map.tsx's own timeout is 6s).
    await page.waitForTimeout(6500);
    await page.screenshot({ path: `${SHOT_DIR}/06-admin-overview.png`, fullPage: true });

    await page.goto("/admin/map");
    await page.screenshot({ path: `${SHOT_DIR}/14-admin-map.png`, fullPage: true });

    await page.goto("/admin/escalations");
    await page.screenshot({ path: `${SHOT_DIR}/07-admin-escalations.png`, fullPage: true });

    await page.goto("/admin/metrics");
    await page.screenshot({ path: `${SHOT_DIR}/08-admin-metrics.png`, fullPage: true });

    await page.goto("/admin/sources");
    await page.screenshot({ path: `${SHOT_DIR}/09-admin-sources.png`, fullPage: true });

    await page.goto("/admin/reports/30000000-0000-0000-0000-000000000001");
    await expect(page.getByText(/verified warning/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT_DIR}/10-admin-report-detail.png`, fullPage: true });
  });
});

test.describe("ambassador PWA (demo mode)", () => {
  test("queue and case detail", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /view as youth ambassador/i }).click();
    await expect(page).toHaveURL(/\/ambassador$/);
    await page.screenshot({ path: `${SHOT_DIR}/11-ambassador-queue.png`, fullPage: true });

    await page.goto("/ambassador/cases/30000000-0000-0000-0000-000000000001");
    await page.screenshot({ path: `${SHOT_DIR}/12-ambassador-case.png`, fullPage: true });
  });
});

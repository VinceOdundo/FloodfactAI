import { test, expect, type Page, type TestInfo } from "@playwright/test";

const SHOT_DIR = "docs/submission/screenshots";

async function shoot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  if (testInfo.project.name === "chromium") {
    await page.screenshot({ path: `${SHOT_DIR}/${name}`, fullPage });
  }
}

test.describe("public site", () => {
  test("landing page tells the story", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /flood warnings people can trust/i })).toBeVisible();
    await shoot(page, testInfo, "01-landing.png", true);
  });

  test("resident can submit a report", async ({ page }, testInfo) => {
    await page.goto("/report");
    await page.getByLabel(/what are you seeing or hearing/i).fill("Water is rising fast near the railway crossing on Kanini Road");
    await page.getByLabel(/where\?/i).fill("Kanini Road, Mukuru kwa Reuben");
    await shoot(page, testInfo, "02-report-form.png", true);
    await page.getByRole("button", { name: /submit report/i }).click();
    await expect(page.getByText(/report received/i)).toBeVisible({ timeout: 15000 });
    await shoot(page, testInfo, "03-report-confirmed.png", true);
  });

  test("verified alerts feed renders", async ({ page }, testInfo) => {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: /verified alerts/i })).toBeVisible();
    await shoot(page, testInfo, "04-alerts-feed.png", true);
  });

  test("blog index and a post render", async ({ page }, testInfo) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: /how the system works/i })).toBeVisible();
    await shoot(page, testInfo, "13-blog-index.png", true);
  });
});

test.describe("admin mission control (demo mode)", () => {
  test("full admin walkthrough", async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await page.goto("/login");
    await shoot(page, testInfo, "05-login.png", true);
    await page.getByRole("button", { name: /view as admin/i }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
    // Let the map either finish rendering tiles or fall back to the status
    // list (components/admin/live-map.tsx's own timeout is 6s).
    await page.waitForTimeout(6500);
    await shoot(page, testInfo, "06-admin-overview.png", true);

    await page.goto("/admin/map");
    await shoot(page, testInfo, "14-admin-map.png", true);

    await page.goto("/admin/escalations");
    await shoot(page, testInfo, "07-admin-escalations.png", true);

    // Not just viewing the queue — actually resolve one.
    await page.getByPlaceholder(/what did you find/i).first().fill(
      "Checked with the ambassador on the ground — false alarm, cleared."
    );
    await page.getByRole("button", { name: /mark resolved/i }).first().click();
    await expect(page.getByText(/^resolved\.$/i).first()).toBeVisible({ timeout: 10000 });

    await page.goto("/admin/metrics");
    await shoot(page, testInfo, "08-admin-metrics.png", true);

    await page.goto("/admin/sources");
    await shoot(page, testInfo, "09-admin-sources.png", true);

    await page.goto("/admin/reports/30000000-0000-0000-0000-000000000001");
    await expect(page.getByText(/verified warning/i)).toBeVisible();
    await shoot(page, testInfo, "10-admin-report-detail.png", true);
  });
});

test.describe("ambassador PWA (demo mode)", () => {
  test("queue and case detail", async ({ page }, testInfo) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /view as youth ambassador/i }).click();
    await expect(page).toHaveURL(/\/ambassador$/, { timeout: 15000 });
    await shoot(page, testInfo, "11-ambassador-queue.png", true);

    await page.goto("/ambassador/cases/30000000-0000-0000-0000-000000000001");
    await shoot(page, testInfo, "12-ambassador-case.png", true);

    // Not just viewing the case — actually submit a ground-truth confirmation.
    await page.getByRole("button", { name: /yes, flooding confirmed/i }).click();
    await expect(page.getByText(/thanks — logged on the ground/i)).toBeVisible({ timeout: 10000 });
  });
});

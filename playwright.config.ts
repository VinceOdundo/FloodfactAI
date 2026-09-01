import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// This sandbox pre-installs a fixed Chromium build under a versioned path
// that doesn't match whatever @playwright/test resolves to, so the default
// "download on demand" flow 404s. Point straight at the stable `chromium`
// symlink when present; falls through to Playwright's own resolution
// (e.g. a real CI runner that ran `playwright install`) otherwise.
const PINNED_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(PINNED_CHROMIUM) ? PINNED_CHROMIUM : undefined;

// The admin map (components/admin/live-map.tsx) renders with WebGL
// (MapLibre GL). Headless Chromium disables real GPU WebGL by default and,
// since Chromium ~130, also disables the SwiftShader software fallback
// unless explicitly re-enabled for automation — without these flags the
// map silently renders as a blank canvas, no error thrown.
const WEBGL_ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

// This sandbox requires ALL outbound HTTPS through a local agent proxy
// (HTTPS_PROXY) — Node tooling (curl, fetch in server code) picks that up
// automatically, but a browser Chromium launches does not inherit it on its
// own. Without this, the map's basemap style/tile requests just hang and
// the map renders blank, again with no visible error. Irrelevant outside
// this sandbox (a real deployment has no such proxy), so only applied when
// the env var is actually present.
const proxyServer = process.env.HTTPS_PROXY ?? process.env.https_proxy;
const PROXY = proxyServer ? { server: proxyServer, bypass: "localhost,127.0.0.1" } : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath, args: WEBGL_ARGS, proxy: PROXY },
      },
    },
    {
      name: "mobile-android",
      use: {
        ...devices["Pixel 7"],
        launchOptions: { executablePath, args: WEBGL_ARGS, proxy: PROXY },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: { DEMO_MODE: "true" },
      },
});

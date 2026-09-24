import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests that run against a REAL deployment and the LIVE Hub.
 * Run by hand only — `npm run e2e:signup`. Not part of CI or any other script.
 *
 * Secrets come from the untracked `.env.e2e.local` at the repo root (see
 * `.env.e2e.example`). A variable already set in the shell wins.
 */
const envFile = path.resolve(__dirname, "..", ".env.e2e.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  testDir: __dirname,
  // One worker, no retries: every run creates and deletes live records, and a
  // retry would create a second set before the first one's cleanup ran.
  workers: 1,
  retries: 0,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://www.chajewelsjp.com",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: path.resolve(__dirname, "..", "test-results"),
});

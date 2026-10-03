import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync(".artifacts", { recursive: true });
const database = `file:.artifacts/e2e-${Date.now()}.db`;
export default defineConfig({
  timeout: 60000,
  expect: { timeout: 15000 },
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1280, height: 960 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run db:seed && npm run dev -- --port 3100",
    url: "http://localhost:3100",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: database,
      TELEGRAM_BOT_TOKEN: "12345:local-e2e-only",
      SESSION_SECRET: "local-e2e-session-secret-at-least-32-characters",
      ADMIN_TELEGRAM_IDS: "111222333",
    },
  },
});

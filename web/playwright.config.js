import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 300_000,
  workers: 1,
  use: {
    baseURL: process.env.SITE_URL || "http://127.0.0.1:4173",
    headless: true,
    locale: "pt-BR",
  },
  webServer: process.env.SITE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        port: 4173,
        reuseExistingServer: true,
      },
});

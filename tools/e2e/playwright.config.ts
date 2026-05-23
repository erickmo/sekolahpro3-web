import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: process.env.E2E_BASE ?? "https://app.sekolahpro.localhost:8443", ignoreHTTPSErrors: true },
  workers: 1,
  reporter: "list",
});

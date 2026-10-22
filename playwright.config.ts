import { defineConfig, devices } from "@playwright/test";

// E2E tests need the local Postgres from docker-compose.yml and a migrated database.
export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Pixel 5"],
    viewport: { width: 360, height: 800 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});

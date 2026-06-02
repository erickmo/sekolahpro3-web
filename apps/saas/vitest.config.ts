/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Component tests render real @sekolahpro/ui parts under jsdom. globals:false
// keeps the test API explicit (imported per file), matching the rest of the
// monorepo; each test file owns its own afterEach(cleanup).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});

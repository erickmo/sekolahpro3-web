import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    // PPDB tests drive ~13 sequential userEvent interactions; under parallel
    // turbo load the default 5s testTimeout flakes. Generous headroom (passes
    // in <1s in isolation) keeps CI deterministic without masking real failures.
    testTimeout: 20000,
  },
});

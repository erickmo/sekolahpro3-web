import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    port: 5181,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        headers: { Host: "sekolahpro.localhost" },
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: { "*": "/" },
      },
      "/assets": {
        target: "http://localhost:8080",
        changeOrigin: true,
        headers: { Host: "sekolahpro.localhost" },
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: { "*": "/" },
      },
    },
  },
  build: { outDir: "dist", sourcemap: true },
  define: process.env.NODE_ENV === "test"
    ? { "import.meta.env.VITE_USE_MOCKS": JSON.stringify("true") }
    : undefined,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    env: { VITE_USE_MOCKS: "true" },
  },
});

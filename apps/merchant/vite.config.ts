/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SekolahPro Merchant",
        short_name: "Merchant",
        description: "Kasir tap-pay kartu siswa",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 5184,
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
    },
  },
  build: { outDir: "dist", sourcemap: true },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});

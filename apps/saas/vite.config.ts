import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

const proxyTarget = {
  target: "http://localhost:8080",
  changeOrigin: true,
  headers: { Host: "sekolahpro.localhost" },
  cookieDomainRewrite: { "*": "" },
  cookiePathRewrite: { "*": "/" },
};

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    port: 5176,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": proxyTarget,
      "/assets": proxyTarget,
    },
  },
  build: { outDir: "dist", sourcemap: true },
});

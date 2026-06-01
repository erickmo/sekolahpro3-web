import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Per-school public site SPA. Tenant is resolved at runtime from the request
// host (see src/lib/site.ts), so the build is a single static bundle served on
// every school domain/subdomain. Dev proxies API calls to the Frappe backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5184,
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true, headers: { Host: "sekolahpro.localhost" } },
      "/assets": { target: "http://localhost:8080", changeOrigin: true, headers: { Host: "sekolahpro.localhost" } },
      "/files": { target: "http://localhost:8080", changeOrigin: true, headers: { Host: "sekolahpro.localhost" } },
    },
  },
  build: { sourcemap: true, outDir: "dist" },
});

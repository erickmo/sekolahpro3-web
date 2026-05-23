import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: { port: 5176, host: "0.0.0.0" },
  build: { outDir: "dist", sourcemap: true },
});

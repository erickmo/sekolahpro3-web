import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: { port: 5175, host: "0.0.0.0" },
  build: { outDir: "dist", sourcemap: true },
});

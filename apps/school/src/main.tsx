import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
import { useSessionStore } from "@sekolahpro/auth";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const env = parseEnv(import.meta.env);
configure({
  baseUrl: env.VITE_API_BASE,
  // Tenant-scope every Frappe list/doc fetch to the active school. Reads
  // synchronously from the persisted session store on each request so the
  // value tracks setActiveSekolah without prop drilling.
  getActiveSekolah: () => useSessionStore.getState().activeSekolah?.name ?? null,
});

const qc = createQueryClient();
const router = createRouter({ routeTree, context: {} });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

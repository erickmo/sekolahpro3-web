import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
import { AdsProvider } from "@sekolahpro/ads";
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
  // Full tenant descriptor: under /kop the anchor is a Koperasi (name =
  // Koperasi doc-ID + covered schools); everywhere else it is a Sekolah.
  getActiveTenant: () => {
    const a = useSessionStore.getState().activeSekolah;
    if (!a) return null;
    if (a.kind === "koperasi") {
      return { kind: "koperasi", koperasi: a.name, schools: a.schools ?? [] };
    }
    return { kind: "sekolah", sekolah: a.name };
  },
});

const qc = createQueryClient();
const router = createRouter({ routeTree, context: {} });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AdsProvider baseUrl={env.VITE_ADS_BASE ?? ""} propertyKey={env.VITE_ADS_PROPERTY_KEY ?? ""}>
        <RouterProvider router={router} />
      </AdsProvider>
    </QueryClientProvider>
  </StrictMode>,
);

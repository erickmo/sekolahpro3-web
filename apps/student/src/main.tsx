import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
import { AdsProvider } from "@sekolahpro/ads";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const env = parseEnv(import.meta.env);
configure({ baseUrl: env.VITE_API_BASE });

const qc = createQueryClient();
const router = createRouter({ routeTree, context: {} });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
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

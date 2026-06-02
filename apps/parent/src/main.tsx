import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { AdsProvider } from "@sekolahpro/ads";
import { ActiveChildProvider } from "./lib/activeChild";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const adsBase = (import.meta.env.VITE_ADS_BASE as string | undefined) ?? "";
const adsKey = (import.meta.env.VITE_ADS_PROPERTY_KEY as string | undefined) ?? "";
configure({ baseUrl: apiBase });

const queryClient = createQueryClient();
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ActiveChildProvider>
        <AdsProvider baseUrl={adsBase} propertyKey={adsKey}>
          <RouterProvider router={router} />
        </AdsProvider>
      </ActiveChildProvider>
    </QueryClientProvider>
  </StrictMode>,
);

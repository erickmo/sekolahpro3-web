import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { ActiveChildProvider } from "./lib/activeChild";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
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
        <RouterProvider router={router} />
      </ActiveChildProvider>
    </QueryClientProvider>
  </StrictMode>,
);

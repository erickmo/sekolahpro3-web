import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

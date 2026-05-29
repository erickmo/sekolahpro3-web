import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
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

// Dev-only mock bootstrap. Wrapped in an async IIFE to avoid top-level await,
// which the build target (es2020) does not support.
async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    const { startMocks } = await import("./mocks/browser");
    await startMocks();
  }

  // Dev-only: ?stub_session=1 short-circuits the login + merchant claims dance for
  // e2e tests. Gated by VITE_USE_MOCKS so production builds cannot enable it.
  if (
    import.meta.env.VITE_USE_MOCKS === "true" &&
    new URLSearchParams(window.location.search).get("stub_session") === "1"
  ) {
    const { useSessionStore } = await import("@sekolahpro/auth");
    useSessionStore.setState({
      user: "Administrator",
      roles: ["Merchant Operator"],
      csrfToken: "stub",
      status: "authenticated",
      // Attach merchant claims that useMerchantContext() reads.
      claims: {
        merchant_id: "M-001",
        terminal_id: "TERM-M-001-00001",
        void_window_minutes: 10,
      },
    } as never);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();

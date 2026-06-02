import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SiteProvider } from "../SiteContext";
import { demoSite } from "../data/demo-site";
import type { SiteData } from "../types";

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

/** Wrap UI in query + router providers (no site context). */
export function renderApp(ui: ReactElement, initialPath = "/"): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Wrap UI with a resolved site context (for section-level tests). */
export function renderWithSite(ui: ReactNode, site: SiteData = demoSite, initialPath = "/"): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <SiteProvider value={site}>{ui}</SiteProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

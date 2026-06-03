import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "smp-demo" }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

const fetchMock = vi.fn(async (method: string, _args?: unknown) => {
  if (method.endsWith("get_situs")) {
    return { sekolah: "smp-demo", status: "Draft", template: "klasik", subdomain: "smp-demo", custom_domain: null, domain_verified: 0 };
  }
  return { ok: true };
});
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => fetchMock(method, args)) };
});

import { SitusOverviewPage } from "../sch.$sekolah.situs.index";

afterEach(() => { cleanup(); fetchMock.mockClear(); fetchMock.mockImplementation(async (m: string) => (m.endsWith("get_situs") ? { sekolah: "smp-demo", status: "Draft", template: "klasik", subdomain: "smp-demo", custom_domain: null, domain_verified: 0 } : { ok: true })); });

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}
const publishCalls = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("publish"));

describe("SitusOverviewPage", () => {
  it("shows the template and domain stat cards from the loaded config", async () => {
    render(wrap(<SitusOverviewPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText("klasik")).toBeInTheDocument());
    expect(screen.getByText("smp-demo")).toBeInTheDocument();
  });

  it("publishes a draft site when the publish button is clicked", async () => {
    render(wrap(<SitusOverviewPage sekolah="smp-demo" />));
    // Wait for the config to load so the publish button is no longer disabled.
    await waitFor(() => expect(screen.getByText("klasik")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Terbitkan/ }));
    await waitFor(() => expect(publishCalls()).toHaveLength(1));
    expect((publishCalls()[0]![1] as { status: string }).status).toBe("Terbit");
  });

  it("offers to revert to draft and flags the live badge once published", async () => {
    fetchMock.mockImplementation(async (m: string) =>
      m.endsWith("get_situs") ? { sekolah: "smp-demo", status: "Terbit", template: "modern", subdomain: "smp-demo", custom_domain: null, domain_verified: 1 } : { ok: true });
    render(wrap(<SitusOverviewPage sekolah="smp-demo" />));
    expect(await screen.findByRole("button", { name: /Jadikan Draft/ })).toBeInTheDocument();
    expect(screen.getByText(/Situs aktif & terlihat publik/)).toBeInTheDocument();
  });

  it("links the preview button to the school's situs URL", async () => {
    render(wrap(<SitusOverviewPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText("klasik")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Lihat Situs/ })).toHaveAttribute("href", "https://smp-demo.sekolahpro.id");
  });
});

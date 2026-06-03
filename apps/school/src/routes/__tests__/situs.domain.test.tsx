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

interface SitusStub { subdomain: string | null; custom_domain: string | null; ssl_status: string; domain_verified: 0 | 1; }
let situsStub: SitusStub = { subdomain: "smp-demo", custom_domain: null, ssl_status: "Pending", domain_verified: 0 };
const saveMock = vi.fn(async (_m: string, _a: unknown) => ({ ok: true }));
const fetchMock = vi.fn((method: string, args: unknown) =>
  method.endsWith("get_situs") ? Promise.resolve({ sekolah: "smp-demo", ...situsStub }) : saveMock(method, args));
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => fetchMock(method, args)) };
});

import { DomainPage } from "../sch.$sekolah.situs.domain";

afterEach(() => {
  cleanup(); saveMock.mockClear();
  situsStub = { subdomain: "smp-demo", custom_domain: null, ssl_status: "Pending", domain_verified: 0 };
});

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe("DomainPage", () => {
  it("prefills the subdomain input from the loaded config", async () => {
    render(wrap(<DomainPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("smp-demo")).toBeInTheDocument());
  });

  it("renders the SSL status badge from the config", async () => {
    situsStub = { subdomain: "smp-demo", custom_domain: null, ssl_status: "Provisioned", domain_verified: 1 };
    render(wrap(<DomainPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText(/SSL: Provisioned/)).toBeInTheDocument());
    expect(screen.getByText("Terverifikasi")).toBeInTheDocument();
  });

  it("shows DNS instructions only once a custom domain is entered", async () => {
    render(wrap(<DomainPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("smp-demo")).toBeInTheDocument());
    expect(screen.queryByText(/Arahkan DNS/)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("www.namasekolah.sch.id"), { target: { value: "www.smp.sch.id" } });
    expect(screen.getByText(/Arahkan DNS/)).toBeInTheDocument();
  });

  it("saves the domain settings with the entered values", async () => {
    render(wrap(<DomainPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("smp-demo")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("smp-pelita"), { target: { value: "smp-baru" } });
    fireEvent.click(screen.getByRole("button", { name: /Simpan Domain/ }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const args = saveMock.mock.calls[0]![1] as { subdomain: string };
    expect(args.subdomain).toBe("smp-baru");
  });
});

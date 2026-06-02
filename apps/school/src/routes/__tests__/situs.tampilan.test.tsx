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

const saveMock = vi.fn(async (_method: string, _args: unknown) => ({}));
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return {
    ...actual,
    frappeFetch: vi.fn((method: string, args: unknown) => {
      if (method.endsWith("get_situs")) {
        return Promise.resolve({ sekolah: "smp-demo", template: "klasik", hero_eyebrow: "Halo" });
      }
      if (method.endsWith("list_template")) {
        return Promise.resolve([
          { key: "klasik", nama: "Klasik", deskripsi: "Resmi", radius: "8px", font_heading: "Merriweather", shadow: "sm" },
        ]);
      }
      return saveMock(method, args);
    }),
  };
});

import { TampilanPage } from "../sch.$sekolah.situs.tampilan";

afterEach(() => { cleanup(); saveMock.mockClear(); });

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe("TampilanPage Phase-3", () => {
  it("renders the hero secondary inputs prefilled from data", async () => {
    render(wrap(<TampilanPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Halo")).toBeInTheDocument());
    expect(screen.getByText("Eyebrow Hero")).toBeInTheDocument();
    expect(screen.getByText("Label Tombol Kedua")).toBeInTheDocument();
    expect(screen.getByText("URL Tombol Kedua")).toBeInTheDocument();
  });

  it("shows template token preview on the card", async () => {
    render(wrap(<TampilanPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText("Klasik")).toBeInTheDocument());
    expect(screen.getByText(/Merriweather/)).toBeInTheDocument();
    expect(screen.getByText(/8px/)).toBeInTheDocument();
  });

  it("persists the secondary hero fields on save", async () => {
    render(wrap(<TampilanPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Halo")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Label Tombol Kedua"), { target: { value: "Hubungi" } });
    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const firstCall = saveMock.mock.calls[0];
    const args = firstCall?.[1];
    expect((args as { values: Record<string, unknown> }).values.hero_cta2_label).toBe("Hubungi");
  });
});

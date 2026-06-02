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
        return Promise.resolve({
          sekolah: "smp-demo",
          keunggulan: [{ ikon: "a", judul: "Aman", deskripsi: "x" }],
          statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
          testimoni: [{ nama: "Budi", peran: "Wali", foto: "", kutipan: "Bagus" }],
        });
      }
      return saveMock(method, args);
    }),
  };
});

import { SorotanPage } from "../sch.$sekolah.situs.sorotan";

afterEach(() => { cleanup(); saveMock.mockClear(); });

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe("SorotanPage", () => {
  it("renders the three sub-sections and existing rows", async () => {
    render(wrap(<SorotanPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText("Aman")).toBeInTheDocument());
    // Exact names target the section tabs (regex would also match the
    // "+ Tambah Keunggulan" action button inside the active ChildArrayManager).
    expect(screen.getByRole("button", { name: "Keunggulan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Statistik" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Testimoni" })).toBeInTheDocument();
  });

  it("saving the active section posts that field's array to save_situs", async () => {
    render(wrap(<SorotanPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText("Aman")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^Simpan$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const [method, args] = saveMock.mock.calls[0]!;
    expect(method).toBe("sekolahpro.api.situs_admin.save_situs");
    expect((args as { values: Record<string, unknown> }).values).toHaveProperty("keunggulan");
  });
});

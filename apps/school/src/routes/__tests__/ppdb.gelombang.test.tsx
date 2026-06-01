/**
 * Tests untuk halaman Gelombang PPDB (redesain berbasis kartu).
 *
 * Memverifikasi bahwa satu gelombang dari api-client dirender sebagai kartu
 * batch lengkap dengan GaugeArc kuota (aria-label "Pengukur ...") dan timeline
 * tanggal buka..tutup. api-client di-stub agar test murni terhadap UI.
 */

// vitest.config sets globals:false → import test API explicitly.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// --- Router stub: page hanya butuh createFileRoute, useParams, Link. ---
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "sekolah-test" }),
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}));

// --- Auth stub: peran manajer agar guidance konsisten (tidak menggate UI). ---
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: ["Kepala Sekolah"] }),
}));

// --- api-client stub: route by doctype argument. ---
const updateMutate = vi.fn();
const createMutate = vi.fn();

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (doctype: string) => {
    if (doctype === "Gelombang PPDB") {
      return {
        data: [GELOMBANG_FIXTURE],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    }
    // Pendaftaran PPDB aggregate (counts + status mix per gelombang).
    return {
      data: PENDAFTARAN_FIXTURE,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
  useResourceUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  useResourceCreate: () => ({ mutateAsync: createMutate, isPending: false }),
}));

import { Route } from "../sch.$sekolah.ppdb.gelombang";

const GELOMBANG_FIXTURE = {
  name: "GEL-001",
  nama: "Gelombang 1 Reguler",
  tingkat: "10",
  status: "Aktif",
  tahun_ajaran: "2026-2027",
  sekolah: "sekolah-test",
  tanggal_buka: "2026-01-01",
  tanggal_tutup: "2026-03-31",
  biaya_pendaftaran: 250000,
  kuota: 100,
};

// Dua pendaftar di gelombang GEL-001 dengan status berbeda → mini funnel.
const PENDAFTARAN_FIXTURE = [
  { name: "P-1", gelombang_ppdb: "GEL-001", status: "Diajukan" },
  { name: "P-2", gelombang_ppdb: "GEL-001", status: "Diterima" },
];

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function renderPage() {
  // Route adalah object dari createFileRoute stub: { component }.
  const Page = (Route as unknown as { component: () => ReactNode }).component;
  return wrap(<Page />);
}

describe("Halaman Gelombang PPDB", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    createMutate.mockReset();
  });
  afterEach(() => cleanup());

  it("merender kartu batch untuk gelombang dari api-client", () => {
    renderPage();
    // Nama gelombang muncul minimal sekali sebagai judul kartu.
    expect(screen.getAllByText("Gelombang 1 Reguler").length).toBeGreaterThan(0);
  });

  it("merender GaugeArc kuota dengan aria-label pengukur", () => {
    renderPage();
    // 2 pendaftar dari 100 kuota → "Pengukur 2 dari 100, 2 persen".
    const gauge = screen.getByLabelText(/Pengukur 2 dari 100/i);
    expect(gauge).toBeInTheDocument();
  });

  it("menampilkan timeline tanggal buka..tutup pada kartu", () => {
    renderPage();
    expect(screen.getByText(/2026-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/2026-03-31/)).toBeInTheDocument();
  });
});

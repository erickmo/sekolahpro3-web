/**
 * Tests untuk halaman Pendaftaran PPDB (redesain tabel diperkaya — TANPA Kanban).
 *
 * Fokus:
 *  - Tabel memuat baris pendaftar dari list backend (di-stub via api-client).
 *  - Strip distribusi status (DistributionBar) ter-render di atas tabel.
 *  - Memilih satu baris memunculkan aksi massal (Ajukan/Verifikasi).
 *
 * Backend di-stub via mock @sekolahpro/api-client; router di-stub agar komponen
 * dapat dirender tanpa root router penuh (pola sama dengan ppdb.seleksi.test.tsx).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router di-stub: Link jadi <a>, useParams mengembalikan sekolah uji, dan
// createFileRoute mengembalikan factory no-op, useNavigate jadi no-op.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "all" }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

// Baris pendaftaran tiruan — status memakai kosakata backend (PIPELINE_STAGES)
// agar strip distribusi status menghasilkan segmen.
const MOCK_ROWS = [
  {
    name: "PPDB-2026-000001",
    status: "Diverifikasi",
    gelombang_ppdb: "GEL-1",
    calon_siswa: "Arka Pradipta",
    tanggal_daftar: "2026-01-10",
  },
  {
    name: "PPDB-2026-000002",
    status: "Diterima",
    gelombang_ppdb: "GEL-1",
    calon_siswa: "Naya Kirana",
    tanggal_daftar: "2026-01-12",
  },
];

// api-client di-stub: list mengembalikan baris tiruan; mutasi + create no-op.
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: () => ({
    data: MOCK_ROWS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useResourceCreate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  frappeFetch: vi.fn(),
}));

// auth di-stub: hindari crash useSession tanpa provider (fallback permissif).
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: [] }),
}));

import { PpdbDaftarPage } from "../sch.$sekolah.ppdb.daftar";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PpdbDaftarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it("merender tabel berisi baris pendaftar dari data backend", () => {
    wrap(<PpdbDaftarPage />);
    // Nomor pendaftaran kedua baris muncul di tabel.
    expect(screen.getByText("PPDB-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("PPDB-2026-000002")).toBeInTheDocument();
  });

  it("merender strip distribusi status (DistributionBar) di atas tabel", () => {
    wrap(<PpdbDaftarPage />);
    // DistributionBar memberi role=img + aria-label diawali "Distribusi".
    expect(
      screen.getByRole("img", { name: /distribusi/i }),
    ).toBeInTheDocument();
  });

  it("memunculkan aksi massal saat satu baris dipilih", () => {
    wrap(<PpdbDaftarPage />);
    // Sebelum memilih: bar aksi massal belum ada.
    expect(
      screen.queryByRole("button", { name: /verifikasi massal/i }),
    ).not.toBeInTheDocument();
    // Centang checkbox baris pertama (checkbox header = index 0, baris = index 1).
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]!);
    // Setelah memilih: tombol aksi massal muncul.
    expect(
      screen.getByRole("button", { name: /verifikasi massal/i }),
    ).toBeInTheDocument();
  });

  it("merender panduan halaman (PageGuide) Cara pakai", () => {
    wrap(<PpdbDaftarPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });
});

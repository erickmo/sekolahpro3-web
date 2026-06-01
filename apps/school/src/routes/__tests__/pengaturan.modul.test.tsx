/**
 * Tests untuk halaman Modul Aktif (sch.$sekolah.pengaturan.modul).
 *
 * Memverifikasi:
 *  - Header ringkasan "Ringkasan Modul" ter-render di atas tabel master.
 *  - Minimal satu chart aksesibel (DonutChart → role="img") tampil di ringkasan.
 *  - Panduan halaman (PageGuide "Cara pakai halaman ini") ter-render.
 *  - Ringkasan menghitung modul aktif dari useResourceList (aktif === 1).
 *
 * Router/api/auth di-stub penuh agar komponen halaman dapat dirender tanpa
 * RouterProvider (pola sama dengan ppdb.beranda.test.tsx / ppdb.pendaftaran.test.tsx).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router stub: Link → anchor, useParams → sekolah uji, createFileRoute factory
// no-op, useNavigate no-op (dipakai MasterResourcePage saat klik baris).
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "sekolah-uji" }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a href="#stub">{children}</a>,
}));

// Baris "Modul Aktif" tiruan: 2 aktif (aktif === 1), 1 nonaktif (aktif === 0).
const MODUL_ROWS = [
  { name: "MOD-001", nama: "Akademik", aktif: 1 },
  { name: "MOD-002", nama: "Keuangan", aktif: 1 },
  { name: "MOD-003", nama: "Perpustakaan", aktif: 0 },
];

const useResourceListMock = vi.fn(() => ({
  data: MODUL_ROWS,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

// api-client di-stub: list mengembalikan baris tiruan; create/update no-op
// (dipakai MasterCreateModal); listResource untuk export no-op.
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (...args: unknown[]) => useResourceListMock(...(args as [])),
  useResourceCreate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  listResource: vi.fn(),
  frappeFetch: vi.fn(),
}));

// auth di-stub: hindari crash useSession tanpa provider (fallback permissif).
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: [] }),
}));

import { ModulPage } from "../sch.$sekolah.pengaturan.modul";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ModulPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResourceListMock.mockReturnValue({
      data: MODUL_ROWS,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });
  afterEach(() => cleanup());

  it("merender section ringkasan 'Ringkasan Modul'", () => {
    wrap(<ModulPage />);
    // Scope ke heading SectionCard agar tidak bentrok dengan teks langkah
    // PageGuide yang juga menyebut "Ringkasan Modul".
    expect(
      screen.getByRole("heading", { name: /ringkasan modul/i }),
    ).toBeInTheDocument();
  });

  it("merender minimal satu chart aksesibel (DonutChart role=img)", () => {
    wrap(<ModulPage />);
    const charts = screen.getAllByRole("img");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("merender panduan halaman (PageGuide) 'Cara pakai halaman ini'", () => {
    wrap(<ModulPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("ringkasan menghitung jumlah modul aktif dari useResourceList (2 dari 3)", () => {
    wrap(<ModulPage />);
    // Persentase modul aktif = round(2/3*100) = 67% → muncul di deskripsi section.
    expect(screen.getByText(/67% modul aktif/i)).toBeInTheDocument();
  });
});

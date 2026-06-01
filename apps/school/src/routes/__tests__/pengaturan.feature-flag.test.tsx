/**
 * Tests untuk halaman Feature Flag (sch.$sekolah.pengaturan.feature-flag).
 *
 * Memverifikasi:
 *  - Header ringkasan "Ringkasan Feature Flag" ter-render di atas tabel master.
 *  - Minimal satu chart aksesibel (DistributionBar → role="img") tampil.
 *  - Panduan halaman (PageGuide "Cara pakai halaman ini") ter-render.
 *  - Ringkasan menghitung flag aktif dari useResourceList (enabled === 1).
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

// Baris "Feature Flag" tiruan: 1 on (enabled === 1), 2 off (enabled === 0).
const FLAG_ROWS = [
  { name: "FF-001", key: "ppdb_v2", enabled: 1 },
  { name: "FF-002", key: "rapor_pdf", enabled: 0 },
  { name: "FF-003", key: "absensi_qr", enabled: 0 },
];

const useResourceListMock = vi.fn(() => ({
  data: FLAG_ROWS,
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

import { FeatureFlagPage } from "../sch.$sekolah.pengaturan.feature-flag";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("FeatureFlagPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResourceListMock.mockReturnValue({
      data: FLAG_ROWS,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });
  afterEach(() => cleanup());

  it("merender section ringkasan 'Ringkasan Feature Flag'", () => {
    wrap(<FeatureFlagPage />);
    // Scope ke heading SectionCard agar konsisten dengan pola modul.
    expect(
      screen.getByRole("heading", { name: /ringkasan feature flag/i }),
    ).toBeInTheDocument();
  });

  it("merender minimal satu chart aksesibel (DistributionBar role=img)", () => {
    wrap(<FeatureFlagPage />);
    const charts = screen.getAllByRole("img");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("merender panduan halaman (PageGuide) 'Cara pakai halaman ini'", () => {
    wrap(<FeatureFlagPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("ringkasan menghitung jumlah flag aktif dari useResourceList (1 dari 3)", () => {
    wrap(<FeatureFlagPage />);
    // Persentase flag aktif = round(1/3*100) = 33% → muncul di deskripsi section.
    expect(screen.getByText(/33% flag aktif/i)).toBeInTheDocument();
  });
});

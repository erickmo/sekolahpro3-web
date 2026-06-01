/**
 * Tests untuk halaman Beranda PPDB (sch.$sekolah.ppdb.index).
 *
 * Memverifikasi:
 *  - KPI StatCard row + minimal satu chart (aria-label) tampil di view Ringkasan.
 *  - Toggle segmented memindah view ke "Antrian Kerja" yang merender grup antrian.
 *  - Default view mengikuti usePpdbRole().primary (manajer → Ringkasan).
 *  - Live wiring: gelombang aktif (kuota + tanggal_tutup), statistik per_status,
 *    jalur, dan pembayaran menggerakkan KPI/viz; saat live kosong halaman tetap
 *    render dengan nilai fallback dari mock (tidak crash / tidak blank).
 *
 * Router di-stub penuh agar komponen halaman bisa dirender tanpa RouterProvider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router stub: Link → anchor, useParams → fixed sekolah, createFileRoute → noop.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "sekolah-uji" }),
  Link: ({ children }: { children: ReactNode }) => <a href="#stub">{children}</a>,
}));

// API stub: useResourceList mengembalikan beberapa baris Pendaftaran PPDB.
const PENDAFTARAN_ROWS = [
  { name: "PPDB-2026-000001", status: "Diajukan", tanggal_daftar: "2026-05-25", calon_siswa: "Arka Pradipta", gelombang_ppdb: "G1", jalur: "Reguler" },
  { name: "PPDB-2026-000002", status: "Diverifikasi", tanggal_daftar: "2026-05-24", calon_siswa: "Naya Kirana", gelombang_ppdb: "G1", jalur: "Prestasi Akademik" },
  { name: "PPDB-2026-000003", status: "Diterima", tanggal_daftar: "2026-05-23", calon_siswa: "Bima Saputra", gelombang_ppdb: "G1", jalur: "Reguler" },
];

const useResourceListMock = vi.fn(() => ({
  data: PENDAFTARAN_ROWS,
  isLoading: false,
  isError: false,
}));

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (...args: unknown[]) => useResourceListMock(...(args as [])),
  frappeFetch: vi.fn(),
}));

// Auth stub: useSession mengembalikan roles yang dipetakan ke primary tertentu.
// "kepala_sekolah" → manajer (default view Ringkasan).
const sessionMock = vi.fn(() => ({ roles: ["kepala_sekolah"] }));
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => sessionMock(),
}));

// Live hooks dari ppdbApi: gelombang aktif + statistik gelombang.
// Adapter murni lain (PIPELINE_STAGES dll) tetap dipakai, jadi tidak di-mock.
const gelombangMock = vi.fn();
const statistikMock = vi.fn();
vi.mock("../../lib/ppdbApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/ppdbApi")>();
  return {
    ...actual,
    useGelombangAktif: () => gelombangMock(),
    useStatistikGelombang: (name: string | undefined) => statistikMock(name),
  };
});

// Live hooks dari ppdbLive: pembayaran. Adapter murni (paymentStatusDistributionLive,
// perStatusToFunnel, jalurDistributionLive) tetap nyata via importOriginal.
const pembayaranMock = vi.fn();
vi.mock("../../lib/ppdbLive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/ppdbLive")>();
  return {
    ...actual,
    usePembayaranLive: () => pembayaranMock(),
  };
});

import { PpdbBerandaPage } from "../sch.$sekolah.ppdb.index";

/** Default: semua live hook kosong → halaman jatuh ke fallback mock. */
function setEmptyLive() {
  useResourceListMock.mockReturnValue({ data: PENDAFTARAN_ROWS, isLoading: false, isError: false });
  gelombangMock.mockReturnValue({ data: [], isLoading: false, isError: false });
  statistikMock.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  pembayaranMock.mockReturnValue({ data: [], isLoading: false, isError: false });
}

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

/**
 * Cari nilai KPI berdasarkan label StatCard. Label & value adalah sibling di
 * dalam satu container `min-w-0`; scope ke container itu agar angka KPI tidak
 * bentrok dengan angka lain di halaman (mis. count antrian / badge).
 */
function expectKpiValue(label: RegExp, value: string) {
  const labelEl = screen.getByText(label);
  const card = labelEl.parentElement as HTMLElement;
  expect(within(card).getByText(value)).toBeInTheDocument();
}

describe("PpdbBerandaPage", () => {
  beforeEach(() => {
    sessionMock.mockReturnValue({ roles: ["kepala_sekolah"] });
    setEmptyLive();
  });
  afterEach(() => cleanup());

  it("menampilkan header PPDB + tombol Buat Pendaftaran", () => {
    wrap(<PpdbBerandaPage />);
    expect(screen.getByText(/buat pendaftaran/i)).toBeInTheDocument();
  });

  it("view Ringkasan menampilkan KPI StatCard + minimal satu chart (aria-label)", () => {
    wrap(<PpdbBerandaPage />);
    // KPI labels dari StatCard row.
    expect(screen.getByText(/total pendaftar/i)).toBeInTheDocument();
    expect(screen.getByText(/lolos seleksi/i)).toBeInTheDocument();
    // Minimal satu chart yang aksesibel (funnel/donut/gauge/trend) ter-render.
    const charts = screen.getAllByRole("img");
    expect(charts.length).toBeGreaterThan(0);
    const hasNamedChart = charts.some((el) => {
      const label = el.getAttribute("aria-label") ?? "";
      return /corong|donat|pengukur|area tren|distribusi/i.test(label);
    });
    expect(hasNamedChart).toBe(true);
  });

  it("menyediakan toggle dua view: Ringkasan dan Antrian Kerja", () => {
    wrap(<PpdbBerandaPage />);
    expect(screen.getByRole("button", { name: /ringkasan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /antrian kerja/i })).toBeInTheDocument();
  });

  it("beralih ke Antrian Kerja menampilkan grup antrian kerja", () => {
    wrap(<PpdbBerandaPage />);
    fireEvent.click(screen.getByRole("button", { name: /antrian kerja/i }));
    // Grup antrian kerja dari buildWorkQueue (label statis) — tetap mock-driven.
    expect(screen.getByText(/verifikasi dokumen/i)).toBeInTheDocument();
    expect(screen.getByText(/pembayaran tertunda/i)).toBeInTheDocument();
  });

  it("default view staff adalah Antrian Kerja", () => {
    // Operator → staff → primary staff → default Antrian Kerja.
    sessionMock.mockReturnValue({ roles: ["operator"] });
    wrap(<PpdbBerandaPage />);
    // Grup antrian langsung tampil tanpa klik toggle.
    expect(screen.getByText(/verifikasi dokumen/i)).toBeInTheDocument();
  });

  it("KPI Hari Tersisa memakai tanggal_tutup gelombang aktif (live)", () => {
    // Gelombang aktif live: tanggal_tutup jauh ke depan + kuota besar.
    gelombangMock.mockReturnValue({
      data: [{ name: "GEL-LIVE", nama: "Gelombang Live", kuota: 500, tanggal_tutup: "2026-12-31", status: "Buka" }],
      isLoading: false,
      isError: false,
    });
    statistikMock.mockReturnValue({
      data: { gelombang: "GEL-LIVE", total_pendaftar: 120, diterima: 40, ditolak: 10, sisa_kuota: 380, per_status: { Diterima: 40, Diajukan: 80 } },
      isLoading: false,
      isError: false,
    });
    wrap(<PpdbBerandaPage />);
    // Hari tersisa dari 2026-05-25 (TODAY) ke 2026-12-31 = 220 hari → bukan
    // angka fallback (2026-06-30 = 36 hari). KPI "Hari Tersisa" harus 220.
    expectKpiValue(/hari tersisa/i, "220");
    // Total pendaftar KPI memakai statistik live total_pendaftar (120), bukan
    // panjang baris mock (3).
    expectKpiValue(/total pendaftar/i, "120");
  });

  it("KPI memakai fallback mock saat live gelombang/statistik kosong", () => {
    // setEmptyLive() sudah aktif: tidak ada gelombang aktif & statistik undefined.
    wrap(<PpdbBerandaPage />);
    // Total pendaftar fallback = panjang baris useResourceList (3).
    expectKpiValue(/total pendaftar/i, "3");
    // Hari tersisa fallback dari deadline 2026-06-30 (TODAY 2026-05-25) = 36.
    expectKpiValue(/hari tersisa/i, "36");
    // Halaman tetap merender chart (tidak blank / crash).
    expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
  });
});

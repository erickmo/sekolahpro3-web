/**
 * Tests untuk halaman Beranda PPDB (sch.$sekolah.ppdb.index).
 *
 * Memverifikasi:
 *  - KPI StatCard row + minimal satu chart (aria-label) tampil di view Ringkasan.
 *  - Toggle segmented memindah view ke "Antrian Kerja" yang merender grup antrian.
 *  - Default view mengikuti usePpdbRole().primary (manajer → Ringkasan).
 *
 * Router di-stub penuh agar komponen halaman bisa dirender tanpa RouterProvider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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
  { name: "PPDB-2026-000001", status: "Diajukan", tanggal_daftar: "2026-05-25", calon_siswa: "Arka Pradipta", gelombang_ppdb: "G1" },
  { name: "PPDB-2026-000002", status: "Diverifikasi", tanggal_daftar: "2026-05-24", calon_siswa: "Naya Kirana", gelombang_ppdb: "G1" },
  { name: "PPDB-2026-000003", status: "Diterima", tanggal_daftar: "2026-05-23", calon_siswa: "Bima Saputra", gelombang_ppdb: "G1" },
];

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: vi.fn(() => ({
    data: PENDAFTARAN_ROWS,
    isLoading: false,
    isError: false,
  })),
  frappeFetch: vi.fn(),
}));

// Auth stub: useSession mengembalikan roles yang dipetakan ke primary tertentu.
// "kepala_sekolah" → manajer (default view Ringkasan).
const sessionMock = vi.fn(() => ({ roles: ["kepala_sekolah"] }));
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => sessionMock(),
}));

import { PpdbBerandaPage } from "../sch.$sekolah.ppdb.index";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PpdbBerandaPage", () => {
  beforeEach(() => {
    sessionMock.mockReturnValue({ roles: ["kepala_sekolah"] });
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
    // Grup antrian kerja dari buildWorkQueue (label statis).
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
});

/**
 * Tests untuk halaman Pengaturan (sch.$sekolah.pengaturan.index).
 *
 * Memverifikasi:
 *  - Header "Pengaturan" + tombol "Ekspor Konfigurasi" ter-render.
 *  - Default tab Ringkasan: KPI (kelengkapan setup, skor keamanan) + minimal
 *    satu chart (aria-label) + onboarding checklist tampil.
 *  - Klik tab "Keamanan" memindah panel ke kebijakan password.
 *  - Role framing: roles ["Tata Usaha"] tetap merender Ringkasan tanpa crash.
 *
 * Router & data layer di-stub penuh agar komponen halaman bisa dirender tanpa
 * RouterProvider / SessionProvider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router stub: createFileRoute → noop, useParams → fixed sekolah, Link → anchor.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "sekolah-uji" }),
  Link: ({ children }: { children: ReactNode }) => <a href="#stub">{children}</a>,
}));

// API stub: useResourceList memberi baris Modul Aktif / Feature Flag untuk
// dashboard Ringkasan (donut adopsi + distribusi flag).
const useResourceListMock = vi.fn(() => ({
  data: [{ name: "row-1", aktif: 1, enabled: 1 }],
  isLoading: false,
  isError: false,
}));

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (...args: unknown[]) => useResourceListMock(...(args as [])),
  frappeFetch: vi.fn(),
}));

// Auth stub: useSession mengembalikan roles yang dipetakan ke peran pengaturan.
const sessionMock = vi.fn(() => ({ roles: ["kepala_sekolah"] }));
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => sessionMock(),
}));

// Summary partial-mock: paksa setup BELUM 100% agar OnboardingChecklist tampil
// (komponen mengembalikan null saat setup lengkap). Sisa adapter (securityScore,
// integrationStats, planUsage, dll) tetap nyata via importOriginal.
vi.mock("../../lib/pengaturanSummary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/pengaturanSummary")>();
  return {
    ...actual,
    setupCompleteness: () => ({
      pct: 60,
      done: 3,
      total: 5,
      items: [
        { label: "Identitas sekolah (nama & NPSN) terisi", tab: "sekolah", done: true },
        { label: "Email kontak sekolah terisi", tab: "sekolah", done: true },
        { label: "Tahun ajaran aktif ditetapkan", tab: "akademik", done: true },
        { label: "Minimal satu integrasi terhubung", tab: "integrasi", done: false },
        { label: "2FA diaktifkan", tab: "keamanan", done: false },
      ],
    }),
  };
});

import { PengaturanPage } from "../sch.$sekolah.pengaturan.index";

/** Render the page tree inside a fresh QueryClient provider. */
function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PengaturanPage", () => {
  beforeEach(() => {
    sessionMock.mockReturnValue({ roles: ["kepala_sekolah"] });
    useResourceListMock.mockReturnValue({
      data: [{ name: "row-1", aktif: 1, enabled: 1 }],
      isLoading: false,
      isError: false,
    });
  });
  afterEach(() => cleanup());

  it("menampilkan header Pengaturan + tombol Ekspor Konfigurasi", () => {
    wrap(<PengaturanPage />);
    expect(screen.getByRole("heading", { name: "Pengaturan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ekspor konfigurasi/i })).toBeInTheDocument();
  });

  it("default tab Ringkasan menampilkan KPI + minimal satu chart", () => {
    wrap(<PengaturanPage />);
    // KPI labels dari StatCard row Ringkasan (juga muncul sebagai judul viz, jadi
    // pakai getAllByText: cukup pastikan minimal satu instance hadir).
    expect(screen.getAllByText(/kelengkapan setup/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/skor keamanan/i).length).toBeGreaterThan(0);
    // Minimal satu chart aksesibel (gauge/donut/bar) ter-render.
    expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
  });

  it("menampilkan onboarding checklist panduan setup", () => {
    wrap(<PengaturanPage />);
    // Judul OnboardingChecklist dirender sebagai heading "Panduan setup sekolah".
    expect(screen.getByRole("heading", { name: /panduan setup/i })).toBeInTheDocument();
  });

  it("klik tab Keamanan memindah panel ke kebijakan password", () => {
    wrap(<PengaturanPage />);
    // Tab buttons hidup di dalam <nav>; scope ke nav agar tidak bentrok dengan
    // tombol quick-link "Keamanan" di view Ringkasan.
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: /keamanan/i }));
    // SectionCard "Kebijakan Password" (heading) hanya muncul di panel Keamanan,
    // bukan di teks panduan — bukti panel benar-benar berpindah.
    expect(screen.getByRole("heading", { name: /kebijakan password/i })).toBeInTheDocument();
  });

  it("role Tata Usaha tetap merender Ringkasan tanpa crash", () => {
    sessionMock.mockReturnValue({ roles: ["Tata Usaha"] });
    wrap(<PengaturanPage />);
    // KPI Ringkasan tetap tampil — hook peran tidak crash untuk role non-kepala.
    expect(screen.getAllByText(/kelengkapan setup/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/skor keamanan/i).length).toBeGreaterThan(0);
  });
});

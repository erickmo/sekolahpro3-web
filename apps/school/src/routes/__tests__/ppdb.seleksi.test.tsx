/**
 * Tests untuk halaman Seleksi PPDB (redesain papan skor).
 *
 * Fokus: viz analitik (histogram skor + donat lulus/gagal) ter-render dengan
 * aria-label yang ringkas, dan tabel peringkat memuat data pelamar terurut.
 * Backend di-stub via mock @sekolahpro/api-client; router di-stub agar komponen
 * dapat dirender tanpa root router penuh.
 *
 * GAP 3 (live wiring): histogram skor memprioritaskan baris "Hasil Tes Akademik
 * PPDB" live (useHasilTesLive) lewat scoreHistogramLive, namun JATUH KEMBALI ke
 * histogram mock (scoreHistogram dari listPpdbForSekolah) saat live kosong.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router di-stub: Link jadi <a>, useParams mengembalikan sekolah uji, dan
// createFileRoute mengembalikan factory no-op (route registrasi tak relevan di unit test).
// Slug sekolah uji nyata agar fixture mock ter-scope dan menghasilkan pelamar.
const TEST_SEKOLAH = "sd-aletheia-malang";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: TEST_SEKOLAH }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

// api-client di-stub: list seleksi kosong + mutasi no-op (page tetap render board).
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useResourceUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  frappeFetch: vi.fn(),
}));

// Hook live Hasil Tes di-stub per-test agar bisa menguji jalur live vs fallback.
// Default (beforeEach): kosong → page memakai histogram mock.
const hasilTesLiveMock = vi.fn();
vi.mock("../../lib/ppdbLive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/ppdbLive")>();
  return { ...actual, useHasilTesLive: () => hasilTesLiveMock() };
});

import { SeleksiPpdbPage } from "../sch.$sekolah.ppdb.seleksi";
import { listPpdbForSekolah } from "../../data/ppdb";
import { scoreHistogram } from "../../lib/ppdbAnalytics";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("SeleksiPpdbPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: live Hasil Tes kosong → histogram jatuh ke data mock.
    hasilTesLiveMock.mockReturnValue({ data: [], isLoading: false });
  });
  afterEach(() => cleanup());

  it("merender histogram skor (BarChart) dengan aria-label diagram batang", () => {
    wrap(<SeleksiPpdbPage />);
    // BarChart memberi role=img + aria-label diawali "Diagram batang.".
    expect(
      screen.getByRole("img", { name: /diagram batang\./i }),
    ).toBeInTheDocument();
  });

  it("histogram skor memakai data LIVE saat baris Hasil Tes tersedia", () => {
    // Dua baris live di bucket 90-100; bucket lain nol → BarChart aria-label
    // (summary "label: value") harus memuat "90-100: 2".
    hasilTesLiveMock.mockReturnValue({
      data: [
        { name: "T1", skor: 95 },
        { name: "T2", skor: 100 },
      ],
      isLoading: false,
    });
    wrap(<SeleksiPpdbPage />);
    const bar = screen.getByRole("img", { name: /diagram batang\./i });
    expect(bar).toHaveAttribute("aria-label", expect.stringContaining("90-100: 2"));
    // Bucket bawah kosong dari sumber live (bukan mock yang punya banyak skor).
    expect(bar).toHaveAttribute("aria-label", expect.stringContaining("0-9: 0"));
  });

  it("histogram skor JATUH KEMBALI ke data mock saat live kosong", () => {
    // Live kosong (default beforeEach) → histogram = scoreHistogram(mock list).
    wrap(<SeleksiPpdbPage />);
    const mockHisto = scoreHistogram(listPpdbForSekolah(TEST_SEKOLAH));
    const expectedSummary = mockHisto.map((d) => `${d.label}: ${d.value}`).join(", ");
    const bar = screen.getByRole("img", { name: /diagram batang\./i });
    expect(bar).toHaveAttribute("aria-label", `Diagram batang. ${expectedSummary}`);
    // Sanity: fixture mock punya total skor > 0 (bukan histogram nol).
    expect(mockHisto.reduce((s, d) => s + d.value, 0)).toBeGreaterThan(0);
  });

  it("merender donat lulus/gagal (DonutChart) dengan aria-label diagram donat", () => {
    wrap(<SeleksiPpdbPage />);
    // DonutChart memberi role=img + aria-label diawali "Diagram donat".
    expect(
      screen.getByRole("img", { name: /diagram donat/i }),
    ).toBeInTheDocument();
  });

  it("menampilkan tabel peringkat berisi pelamar dari data mock", () => {
    wrap(<SeleksiPpdbPage />);
    // Judul kartu papan peringkat hadir (boleh juga muncul di tips panduan).
    expect(screen.getAllByText(/peringkat skor/i).length).toBeGreaterThan(0);
    // Papan peringkat memuat pelamar berskor: ambil pelamar skor tertinggi dari
    // sumber mock yang sama lalu pastikan namanya muncul di tabel.
    const scored = listPpdbForSekolah(TEST_SEKOLAH)
      .filter((p) => p.skorTes !== undefined)
      .sort((a, b) => (b.skorTes ?? 0) - (a.skorTes ?? 0));
    expect(scored.length).toBeGreaterThan(0);
    const top = scored[0]!;
    expect(screen.getAllByText(top.namaLengkap).length).toBeGreaterThan(0);
    // Nomor pendaftaran pelamar teratas juga ter-render di kolom tabel.
    expect(screen.getByText(top.noPendaftaran)).toBeInTheDocument();
  });

  it("mempertahankan tombol bulk Umumkan Hasil", () => {
    wrap(<SeleksiPpdbPage />);
    expect(
      screen.getByRole("button", { name: /umumkan hasil/i }),
    ).toBeInTheDocument();
  });

  it("merender panduan halaman (PageGuide) Cara pakai", () => {
    wrap(<SeleksiPpdbPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });
});

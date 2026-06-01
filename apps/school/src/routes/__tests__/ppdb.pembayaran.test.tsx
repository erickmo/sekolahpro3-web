/**
 * Tests untuk halaman Pembayaran PPDB (redesain).
 *
 * Memverifikasi:
 *  - GaugeArc terkumpul-vs-tagihan + DonutChart status pembayaran terender.
 *  - Bagian aging mendaftarkan pendaftar dengan tunggakan melewati ambang.
 *  - Flow list + "Buat Order" lama tetap ada (regresi).
 *
 * vitest.config sets globals:false → import test API explicitly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Pendaftar } from "../../data/ppdb";

// --- Router stubs: page calls useParams + Link + createFileRoute. ---
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "s1" }),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

// --- API stubs: useResourceList drives the list, frappeFetch the order. ---
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
  frappeFetch: vi.fn(),
}));

// --- Live hooks: usePembayaranLive feeds gauge + donut + aging when non-empty. ---
vi.mock("../../lib/ppdbLive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/ppdbLive")>();
  return { ...actual, usePembayaranLive: vi.fn() };
});

// --- Mock data source so aging is deterministic, independent of fixtures. ---
vi.mock("../../data/ppdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../data/ppdb")>();
  return { ...actual, listPpdbForSekolah: vi.fn() };
});

import { listPpdbForSekolah } from "../../data/ppdb";
import { usePembayaranLive } from "../../lib/ppdbLive";
import type { PembayaranLiveRow } from "../../lib/ppdbLive";
import { PembayaranPpdbPage } from "../sch.$sekolah.ppdb.pembayaran";

/** Shape the usePembayaranLive mock return; rows default to empty (fallback). */
function mockLive(rows: PembayaranLiveRow[]): void {
  vi.mocked(usePembayaranLive).mockReturnValue({
    data: rows,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof usePembayaranLive>);
}

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// Minimal Pendaftar factory — only fields the payment analytics read.
function makePendaftar(over: Partial<Pendaftar>): Pendaftar {
  return {
    noPendaftaran: "PPDB-2026-000001",
    sekolah: "s1" as Pendaftar["sekolah"],
    namaLengkap: "Budi Santoso",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Bandung",
    tanggalLahir: "2010-01-01",
    agama: "Islam",
    kewarganegaraan: "WNI",
    jenjangTujuan: "SMP",
    jalur: "Reguler",
    asalSekolah: "SD Negeri 1",
    statusPendaftaran: "Diterima",
    tahunAjaran: "2026/2027",
    tanggalDaftar: "2026-05-01",
    biayaPendaftaran: 250000,
    totalBiaya: 1000000,
    totalDibayar: 400000,
    wali: [],
    dokumen: [],
    tahapan: [],
    raporSmp: [],
    pembayaran: [],
    wawancara: [],
    aktivitas: [],
    ...over,
  };
}

describe("PembayaranPpdbPage (redesain)", () => {
  beforeEach(() => {
    vi.mocked(listPpdbForSekolah).mockReset();
    vi.mocked(usePembayaranLive).mockReset();
    // Default: live returns nothing → page must degrade to the mock fallback.
    mockLive([]);
  });
  afterEach(() => cleanup());

  it("merender GaugeArc terkumpul vs tagihan dari fallback mock saat live kosong", () => {
    vi.mocked(listPpdbForSekolah).mockReturnValue([
      makePendaftar({ totalBiaya: 1000000, totalDibayar: 600000 }),
    ]);
    wrap(<PembayaranPpdbPage />);
    // GaugeArc emits role="img" with "Pengukur N dari M, P persen".
    expect(
      screen.getByRole("img", { name: /pengukur .* dari .* persen/i }),
    ).toBeInTheDocument();
  });

  it("merender DonutChart distribusi status pembayaran dari fallback mock", () => {
    vi.mocked(listPpdbForSekolah).mockReturnValue([
      makePendaftar({
        pembayaran: [
          { id: "P1", judul: "Uang Pangkal", tanggal: "2026-05-01", jumlah: 500000, status: "Lunas" },
          { id: "P2", judul: "Seragam", tanggal: "2026-05-01", jumlah: 200000, status: "Tertunda" },
        ],
      }),
    ]);
    wrap(<PembayaranPpdbPage />);
    expect(
      screen.getByRole("img", { name: /diagram donat/i }),
    ).toBeInTheDocument();
  });

  it("mendaftarkan pendaftar tunggakan yang melewati ambang di bagian aging (fallback)", () => {
    // tanggal jauh di masa lalu relatif TODAY → pasti > 3 hari → overdue.
    vi.mocked(listPpdbForSekolah).mockReturnValue([
      makePendaftar({
        noPendaftaran: "PPDB-2026-000099",
        namaLengkap: "Siti Tunggakan",
        pembayaran: [
          { id: "PX", judul: "Uang Pangkal", tanggal: "2026-01-01", jumlah: 750000, status: "Tertunda" },
        ],
      }),
    ]);
    wrap(<PembayaranPpdbPage />);
    const aging = screen.getByRole("region", { name: /tunggakan|aging/i });
    expect(within(aging).getByText(/Siti Tunggakan/)).toBeInTheDocument();
  });

  it("tetap menampilkan flow list lama (kolom No. Bayar) — regresi", () => {
    vi.mocked(listPpdbForSekolah).mockReturnValue([]);
    wrap(<PembayaranPpdbPage />);
    expect(screen.getByText(/No\. Bayar/i)).toBeInTheDocument();
  });

  it("memakai usePembayaranLive untuk gauge + donut saat data live tersedia", () => {
    // Mock kosong → bila gauge/donut tetap render, harus berasal dari live rows.
    vi.mocked(listPpdbForSekolah).mockReturnValue([]);
    mockLive([
      { name: "BYR-1", pendaftaran_ppdb: "PPDB-1", jumlah_tagihan: 1000000, jumlah_terbayar: 1000000, status: "Lunas" },
      { name: "BYR-2", pendaftaran_ppdb: "PPDB-2", jumlah_tagihan: 1000000, jumlah_terbayar: 0, status: "Tertunda" },
    ]);
    wrap(<PembayaranPpdbPage />);
    // billed=2_000_000 collected=1_000_000 → 50% → gauge aria carries 50 persen.
    expect(
      screen.getByRole("img", { name: /pengukur 1000000 dari 2000000, 50 persen/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /diagram donat/i })).toBeInTheDocument();
  });

  it("mengelompokkan tunggakan live (jumlah_terbayar < jumlah_tagihan) di aging", () => {
    vi.mocked(listPpdbForSekolah).mockReturnValue([]);
    mockLive([
      { name: "BYR-9", pendaftaran_ppdb: "PPDB-OUTSTANDING", jumlah_tagihan: 500000, jumlah_terbayar: 100000, status: "Cicilan" },
    ]);
    wrap(<PembayaranPpdbPage />);
    const aging = screen.getByRole("region", { name: /tunggakan|aging/i });
    // Live aging memakai pendaftaran_ppdb sebagai identitas baris (nama + nomor).
    expect(within(aging).getAllByText(/PPDB-OUTSTANDING/).length).toBeGreaterThan(0);
  });
});

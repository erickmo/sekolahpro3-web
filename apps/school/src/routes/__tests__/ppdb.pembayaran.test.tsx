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

// --- Mock data source so aging is deterministic, independent of fixtures. ---
vi.mock("../../data/ppdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../data/ppdb")>();
  return { ...actual, listPpdbForSekolah: vi.fn() };
});

import { listPpdbForSekolah } from "../../data/ppdb";
import { PembayaranPpdbPage } from "../sch.$sekolah.akademik.ppdb.pembayaran";

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
  });
  afterEach(() => cleanup());

  it("merender GaugeArc terkumpul vs tagihan", () => {
    vi.mocked(listPpdbForSekolah).mockReturnValue([
      makePendaftar({ totalBiaya: 1000000, totalDibayar: 600000 }),
    ]);
    wrap(<PembayaranPpdbPage />);
    // GaugeArc emits role="img" with "Pengukur N dari M, P persen".
    expect(
      screen.getByRole("img", { name: /pengukur .* dari .* persen/i }),
    ).toBeInTheDocument();
  });

  it("merender DonutChart distribusi status pembayaran", () => {
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

  it("mendaftarkan pendaftar tunggakan yang melewati ambang di bagian aging", () => {
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
});

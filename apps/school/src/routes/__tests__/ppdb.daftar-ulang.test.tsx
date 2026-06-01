/**
 * Tests untuk halaman Daftar Ulang PPDB (redesain berbasis tahapan).
 *
 * Fokus:
 *  - Bilah penyelesaian (DistributionBar) "selesai vs menunggu" ter-render.
 *  - Tiap pelamar diterima memunculkan WorkflowStepper tahapan + tombol
 *    konfirmasi finalisasi.
 *  - Panduan halaman (PageGuide) hadir.
 *  - EmptyState muncul ketika tidak ada pelamar diterima.
 *
 * Router & api-client di-stub agar komponen dapat dirender tanpa root router /
 * backend; finalisasi memanggil frappeFetch yang di-mock.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Pendaftar } from "../../data/ppdb";

// Slug sekolah uji nyata agar fixture mock ter-scope.
const TEST_SEKOLAH = "sd-aletheia-malang";

// Router di-stub: Link jadi <a>, useParams mengembalikan sekolah uji,
// createFileRoute mengembalikan factory no-op.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: TEST_SEKOLAH }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

// api-client di-stub: hanya frappeFetch dipakai (lewat useFinalisasiPendaftaran).
vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

// data/ppdb di-mock agar tiap test mengontrol daftar pelamar diterima.
vi.mock("../../data/ppdb", async () => {
  const actual = await vi.importActual<typeof import("../../data/ppdb")>(
    "../../data/ppdb",
  );
  return { ...actual, listPpdbForSekolah: vi.fn(() => [] as Pendaftar[]) };
});

import { DaftarUlangPpdbPage } from "../sch.$sekolah.ppdb.daftar-ulang";
import { listPpdbForSekolah } from "../../data/ppdb";

const mockedList = vi.mocked(listPpdbForSekolah);

/** Bangun satu Pendaftar diterima minimal dengan tahapan + dokumen lengkap. */
function makeAccepted(overrides: Partial<Pendaftar> = {}): Pendaftar {
  return {
    noPendaftaran: "PPDB-2026-000001",
    sekolah: TEST_SEKOLAH,
    namaLengkap: "Arka Pradipta",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Bandung",
    tanggalLahir: "2010-05-01",
    agama: "Islam",
    kewarganegaraan: "WNI",
    jenjangTujuan: "SMP",
    jalur: "Reguler",
    asalSekolah: "SD Negeri 1",
    statusPendaftaran: "Diterima",
    tahunAjaran: "2026/2027",
    tanggalDaftar: "2026-01-10",
    biayaPendaftaran: 250000,
    totalBiaya: 8000000,
    totalDibayar: 8000000,
    wali: [],
    dokumen: [
      { nama: "KK.pdf", tipe: "KK", status: "Diterima" },
      { nama: "Sehat.pdf", tipe: "Surat Sehat", status: "Diterima" },
    ],
    tahapan: [
      { tahap: "Pendaftaran", tanggal: "2026-01-10", status: "Selesai" },
      { tahap: "Verifikasi Berkas", tanggal: "2026-01-12", status: "Selesai" },
      { tahap: "Tes Akademik", tanggal: "2026-02-01", status: "Selesai" },
      { tahap: "Wawancara", tanggal: "2026-02-05", status: "Selesai" },
      { tahap: "Pengumuman", tanggal: "2026-03-01", status: "Selesai" },
      { tahap: "Daftar Ulang", tanggal: "2026-05-01", status: "Berjalan" },
    ],
    raporSmp: [],
    pembayaran: [
      { id: "PAY-1", judul: "Uang Pangkal", tanggal: "2026-05-01", jumlah: 5000000, status: "Lunas" },
    ],
    wawancara: [],
    aktivitas: [],
    ...overrides,
  };
}

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("DaftarUlangPpdbPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedList.mockReturnValue([makeAccepted()]);
  });
  afterEach(() => cleanup());

  it("merender bilah penyelesaian (DistributionBar) selesai vs menunggu", () => {
    wrap(<DaftarUlangPpdbPage />);
    // DistributionBar memberi role=img + aria-label diawali "Distribusi".
    expect(
      screen.getByRole("img", { name: /distribusi/i }),
    ).toBeInTheDocument();
  });

  it("merender WorkflowStepper tahapan untuk pelamar diterima", () => {
    wrap(<DaftarUlangPpdbPage />);
    // WorkflowStepper memberi aria-label "Status workflow".
    expect(screen.getAllByLabelText(/status workflow/i).length).toBeGreaterThan(0);
    // Nama pelamar diterima hadir di kartu.
    expect(screen.getByText("Arka Pradipta")).toBeInTheDocument();
  });

  it("menampilkan tombol konfirmasi finalisasi untuk pelamar diterima", () => {
    wrap(<DaftarUlangPpdbPage />);
    expect(
      screen.getAllByRole("button", { name: /finalisasi/i }).length,
    ).toBeGreaterThan(0);
  });

  it("merender panduan halaman (PageGuide) Cara pakai", () => {
    wrap(<DaftarUlangPpdbPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("menampilkan EmptyState ketika tidak ada pelamar diterima", () => {
    mockedList.mockReturnValue([]);
    wrap(<DaftarUlangPpdbPage />);
    // Tidak ada stepper ketika daftar kosong.
    expect(screen.queryByLabelText(/status workflow/i)).not.toBeInTheDocument();
    // Pesan kosong khas EmptyState muncul.
    expect(screen.getByText(/belum ada pelamar diterima/i)).toBeInTheDocument();
  });
});

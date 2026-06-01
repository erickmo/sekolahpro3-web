/**
 * Tests untuk halaman Daftar Ulang PPDB (live wiring + fallback mock).
 *
 * Fokus:
 *  - Sumber data LIVE: useResourceList("Pendaftaran PPDB") menyaring pelamar
 *    diterima + useResourceList("Daftar Ulang PPDB") menentukan status selesai;
 *    antrian kartu + bilah penyelesaian (DistributionBar) ter-render dari live.
 *  - FALLBACK: ketika live "Pendaftaran PPDB" kosong, halaman jatuh ke fixture
 *    mock {@link listPpdbForSekolah} (antrian + stepper tetap muncul).
 *  - Stepper + tombol konfirmasi finalisasi per-pelamar tetap ada.
 *  - Panduan halaman (PageGuide) hadir; EmptyState saat keduanya kosong.
 *
 * Router & api-client di-stub agar komponen dapat dirender tanpa root router /
 * backend; useResourceList di-mock per-doctype, finalisasi memanggil frappeFetch.
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

// api-client di-stub: frappeFetch (finalisasi) + useResourceList (live rows).
vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
  useResourceList: vi.fn(() => ({ data: [] })),
}));

// data/ppdb di-mock agar tiap test mengontrol daftar pelamar diterima fallback.
vi.mock("../../data/ppdb", async () => {
  const actual = await vi.importActual<typeof import("../../data/ppdb")>(
    "../../data/ppdb",
  );
  return { ...actual, listPpdbForSekolah: vi.fn(() => [] as Pendaftar[]) };
});

import { DaftarUlangPpdbPage } from "../sch.$sekolah.ppdb.daftar-ulang";
import { listPpdbForSekolah } from "../../data/ppdb";
import { useResourceList } from "@sekolahpro/api-client";

const mockedList = vi.mocked(listPpdbForSekolah);
const mockedUseResourceList = vi.mocked(useResourceList);

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

/**
 * Stub useResourceList per-doctype: kembalikan baris Pendaftaran PPDB untuk
 * doctype "Pendaftaran PPDB" dan baris Daftar Ulang PPDB untuk doctype-nya.
 */
function stubLive(opts: {
  pendaftaran?: Array<Record<string, unknown>>;
  daftarUlang?: Array<Record<string, unknown>>;
}) {
  mockedUseResourceList.mockImplementation((doctype: string) => {
    if (doctype === "Pendaftaran PPDB") return { data: opts.pendaftaran ?? [] } as never;
    if (doctype === "Daftar Ulang PPDB") return { data: opts.daftarUlang ?? [] } as never;
    return { data: [] } as never;
  });
}

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("DaftarUlangPpdbPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedList.mockReturnValue([makeAccepted()]);
    // Default: tidak ada live → fallback mock dipakai.
    mockedUseResourceList.mockReturnValue({ data: [] } as never);
  });
  afterEach(() => cleanup());

  it("merender antrian + bilah penyelesaian dari baris LIVE Pendaftaran PPDB", () => {
    stubLive({
      pendaftaran: [
        { name: "PPDB-LIVE-1", status: "Diterima", calon_siswa: "CS-1", gelombang_ppdb: "G-1" },
        { name: "PPDB-LIVE-2", status: "Daftar Ulang", calon_siswa: "CS-2", gelombang_ppdb: "G-1" },
      ],
      daftarUlang: [
        { name: "DU-1", pendaftaran_ppdb: "PPDB-LIVE-1", status: "Selesai" },
      ],
    });
    wrap(<DaftarUlangPpdbPage />);
    // Bilah penyelesaian (DistributionBar) → role=img + aria-label "Distribusi".
    expect(screen.getByRole("img", { name: /distribusi/i })).toBeInTheDocument();
    // Identitas pelamar LIVE (name pendaftaran) hadir di antrian — id muncul di
    // judul + subtitle, jadi pakai getAllByText (≥1) bukan getByText.
    expect(screen.getAllByText("PPDB-LIVE-1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PPDB-LIVE-2").length).toBeGreaterThan(0);
    // Stepper tahapan hadir untuk tiap pelamar LIVE.
    expect(screen.getAllByLabelText(/status workflow/i).length).toBe(2);
  });

  it("menghitung selesai vs menunggu dari join Daftar Ulang PPDB (LIVE)", () => {
    // 2 diterima; satu punya Daftar Ulang status Selesai, satu lagi statusnya
    // sendiri "Daftar Ulang" (juga dihitung selesai). Keduanya selesai → 2/0.
    stubLive({
      pendaftaran: [
        { name: "PPDB-LIVE-1", status: "Diterima", calon_siswa: "CS-1", gelombang_ppdb: "G-1" },
        { name: "PPDB-LIVE-2", status: "Daftar Ulang", calon_siswa: "CS-2", gelombang_ppdb: "G-1" },
      ],
      daftarUlang: [{ name: "DU-1", pendaftaran_ppdb: "PPDB-LIVE-1", status: "Selesai" }],
    });
    wrap(<DaftarUlangPpdbPage />);
    // Deskripsi SectionCard merangkum "2 selesai • 0 menunggu".
    expect(screen.getByText(/2 selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/0 menunggu/i)).toBeInTheDocument();
  });

  it("menampilkan tombol konfirmasi finalisasi untuk tiap pelamar LIVE", () => {
    stubLive({
      pendaftaran: [
        { name: "PPDB-LIVE-1", status: "Diterima", calon_siswa: "CS-1", gelombang_ppdb: "G-1" },
      ],
    });
    wrap(<DaftarUlangPpdbPage />);
    expect(
      screen.getAllByRole("button", { name: /finalisasi/i }).length,
    ).toBeGreaterThan(0);
  });

  it("FALLBACK: live Pendaftaran kosong → pakai fixture mock listPpdbForSekolah", () => {
    // Live kosong (default beforeEach). Mock mengembalikan satu pelamar diterima.
    wrap(<DaftarUlangPpdbPage />);
    expect(screen.getByRole("img", { name: /distribusi/i })).toBeInTheDocument();
    // Nama pelamar dari fixture mock hadir.
    expect(screen.getByText("Arka Pradipta")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/status workflow/i).length).toBeGreaterThan(0);
  });

  it("merender panduan halaman (PageGuide) Cara pakai", () => {
    wrap(<DaftarUlangPpdbPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("menampilkan EmptyState ketika tidak ada pelamar (live & mock kosong)", () => {
    mockedList.mockReturnValue([]);
    wrap(<DaftarUlangPpdbPage />);
    // Tidak ada stepper ketika antrian kosong.
    expect(screen.queryByLabelText(/status workflow/i)).not.toBeInTheDocument();
    // Pesan kosong khas EmptyState muncul.
    expect(screen.getByText(/belum ada pelamar diterima/i)).toBeInTheDocument();
  });
});

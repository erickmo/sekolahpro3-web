/**
 * Tests untuk halaman Calon Siswa (direktori kartu pendaftar PPDB).
 *
 * Memverifikasi:
 *  - kartu pendaftar muncul dari sumber LIVE useResourceList("Calon Siswa")
 *  - ketika query live kosong, jatuh ke mock listPpdbForSekolah (fallback)
 *  - cincin kelengkapan dokumen di-merge dari useDokumenLive (live override)
 *  - memfilter berdasarkan status mengecilkan himpunan kartu (mock-fallback)
 *  - EmptyState tampil ketika filter tidak menyisakan kartu apa pun
 *  - PageGuide ("Cara pakai halaman ini") dirender
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router distub: komponen halaman diuji langsung (bukan lewat Route).
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "sd-test" }),
  // Link sederhana yang merender anak sebagai anchor agar bisa di-query.
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

// Sumber data fallback: stub mock PPDB agar dataset deterministik di test.
vi.mock("../../data/ppdb", async () => {
  const actual =
    await vi.importActual<typeof import("../../data/ppdb")>("../../data/ppdb");
  return { ...actual, listPpdbForSekolah: vi.fn() };
});

// Sumber data live: useResourceList (Calon Siswa) di-stub.
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: vi.fn(),
}));

// Dokumen completeness live: useDokumenLive di-stub agar terpisah dari list.
vi.mock("../../lib/ppdbLive", async () => {
  const actual =
    await vi.importActual<typeof import("../../lib/ppdbLive")>(
      "../../lib/ppdbLive",
    );
  return { ...actual, useDokumenLive: vi.fn() };
});

import { useResourceList } from "@sekolahpro/api-client";
import { useDokumenLive } from "../../lib/ppdbLive";
import { listPpdbForSekolah, type Pendaftar } from "../../data/ppdb";
import { CalonSiswaPage } from "../sch.$sekolah.ppdb.calon-siswa";

/** Bangun satu Pendaftar minimal untuk fixture fallback (field non-relevan diisi aman). */
function makePendaftar(overrides: Partial<Pendaftar>): Pendaftar {
  const base: Pendaftar = {
    noPendaftaran: "PPDB-2026-000001",
    sekolah: "sd-test" as Pendaftar["sekolah"],
    namaLengkap: "Tanpa Nama",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Bandung",
    tanggalLahir: "2012-01-01",
    agama: "Islam",
    kewarganegaraan: "WNI",
    jenjangTujuan: "SD",
    jalur: "Reguler",
    asalSekolah: "SD Negeri 1",
    statusPendaftaran: "Terkirim",
    tahunAjaran: "2026/2027",
    tanggalDaftar: "2026-01-10",
    biayaPendaftaran: 250000,
    totalBiaya: 1000000,
    totalDibayar: 250000,
    wali: [],
    dokumen: [
      { nama: "KK.pdf", tipe: "KK", status: "Diterima" },
      { nama: "Akta.pdf", tipe: "Akta", status: "Belum" },
    ],
    tahapan: [],
    raporSmp: [],
    pembayaran: [],
    wawancara: [],
    aktivitas: [],
  };
  return { ...base, ...overrides };
}

const FALLBACK_FIXTURE: Pendaftar[] = [
  makePendaftar({
    noPendaftaran: "PPDB-2026-000001",
    namaLengkap: "Arka Pradipta",
    statusPendaftaran: "Diterima",
    jalur: "Reguler",
    jenjangTujuan: "SD",
  }),
  makePendaftar({
    noPendaftaran: "PPDB-2026-000002",
    namaLengkap: "Naya Kirana",
    statusPendaftaran: "Verifikasi",
    jalur: "Zonasi",
    jenjangTujuan: "SMP",
  }),
  makePendaftar({
    noPendaftaran: "PPDB-2026-000003",
    namaLengkap: "Bima Saputra",
    statusPendaftaran: "Diterima",
    jalur: "Afirmasi",
    jenjangTujuan: "SD",
  }),
];

/** Dua baris live "Calon Siswa" (whitelisted fields) untuk skenario live. */
const LIVE_CALON_SISWA = [
  {
    name: "CALON-001",
    nama_lengkap: "Livia Anggraini",
    nisn: "0098765432",
    jenis_kelamin: "Perempuan",
    jenjang: "SD",
  },
  {
    name: "CALON-002",
    nama_lengkap: "Damar Wicaksono",
    nisn: "0091234567",
    jenis_kelamin: "Laki-laki",
    jenjang: "SMP",
  },
];

/** Dokumen live untuk CALON-001: 1 dari 2 diterima → 50%. */
const LIVE_DOKUMEN = [
  { name: "DOC-1", pendaftaran_ppdb: "CALON-001", jenis: "KK", status: "Diterima" },
  { name: "DOC-2", pendaftaran_ppdb: "CALON-001", jenis: "Akta", status: "Belum" },
];

/** Helper: bentuk minimal useQuery result yang dipakai halaman ({ data }). */
function asQuery<T>(data: T) {
  return { data } as unknown as ReturnType<typeof useResourceList>;
}

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CalonSiswaPage", () => {
  beforeEach(() => {
    vi.mocked(listPpdbForSekolah).mockReturnValue(FALLBACK_FIXTURE);
    // Default: live Calon Siswa list kosong → halaman pakai mock fallback.
    vi.mocked(useResourceList).mockReturnValue(asQuery([]));
    vi.mocked(useDokumenLive).mockReturnValue(asQuery([]) as never);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("merender kartu dari sumber LIVE useResourceList Calon Siswa", () => {
    vi.mocked(useResourceList).mockReturnValue(asQuery(LIVE_CALON_SISWA));
    wrap(<CalonSiswaPage />);
    expect(screen.getByText("Livia Anggraini")).toBeInTheDocument();
    expect(screen.getByText("Damar Wicaksono")).toBeInTheDocument();
    // Nama mock TIDAK muncul ketika live menyediakan data.
    expect(screen.queryByText("Arka Pradipta")).toBeNull();
  });

  it("jatuh ke mock listPpdbForSekolah ketika live Calon Siswa kosong", () => {
    vi.mocked(useResourceList).mockReturnValue(asQuery([]));
    wrap(<CalonSiswaPage />);
    expect(screen.getByText("Arka Pradipta")).toBeInTheDocument();
    expect(screen.getByText("Naya Kirana")).toBeInTheDocument();
    expect(screen.getByText("Bima Saputra")).toBeInTheDocument();
  });

  it("memakai cincin kelengkapan dokumen dari useDokumenLive (live override)", () => {
    vi.mocked(useResourceList).mockReturnValue(asQuery(LIVE_CALON_SISWA));
    vi.mocked(useDokumenLive).mockReturnValue(asQuery(LIVE_DOKUMEN) as never);
    wrap(<CalonSiswaPage />);
    const card = screen.getByText("Livia Anggraini").closest("article");
    expect(card).not.toBeNull();
    // ProgressRing me-render persentase live (50%) untuk CALON-001.
    expect(within(card as HTMLElement).getByText(/50/)).toBeInTheDocument();
  });

  it("merender PageGuide cara pakai halaman", () => {
    wrap(<CalonSiswaPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("memfilter berdasarkan status mengecilkan himpunan kartu (fallback)", () => {
    wrap(<CalonSiswaPage />);
    // Awalnya ketiga nama tampil.
    expect(screen.getByText("Naya Kirana")).toBeInTheDocument();

    // Pilih status "Diterima" pada dropdown filter status.
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: "Diterima" } });

    // Naya (Verifikasi) hilang; dua "Diterima" tetap tampil.
    expect(screen.queryByText("Naya Kirana")).toBeNull();
    expect(screen.getByText("Arka Pradipta")).toBeInTheDocument();
    expect(screen.getByText("Bima Saputra")).toBeInTheDocument();
  });

  it("menampilkan EmptyState ketika filter tidak menyisakan kartu", () => {
    wrap(<CalonSiswaPage />);
    // Filter jenjang ke SMA — tidak ada di fixture (hanya SD & SMP).
    const jenjangSelect = screen.getByLabelText(/jenjang/i);
    fireEvent.change(jenjangSelect, { target: { value: "SMA" } });

    expect(screen.queryByText("Arka Pradipta")).toBeNull();
    expect(screen.getByText(/tidak ada calon siswa/i)).toBeInTheDocument();
  });

  it("mencari nama memfilter kartu (case-insensitive)", () => {
    wrap(<CalonSiswaPage />);
    const search = screen.getByPlaceholderText(/cari nama/i);
    fireEvent.change(search, { target: { value: "bima" } });

    expect(screen.getByText("Bima Saputra")).toBeInTheDocument();
    expect(screen.queryByText("Arka Pradipta")).toBeNull();
  });

  it("setiap kartu menampilkan badge jenjang & jalur pendaftar (fallback)", () => {
    wrap(<CalonSiswaPage />);
    const card = screen.getByText("Naya Kirana").closest("article");
    expect(card).not.toBeNull();
    const scoped = within(card as HTMLElement);
    expect(scoped.getByText("SMP")).toBeInTheDocument();
    expect(scoped.getByText("Zonasi")).toBeInTheDocument();
  });
});

/**
 * Tests untuk halaman Pendaftaran PPDB (redesain tabel diperkaya — TANPA Kanban).
 *
 * Fokus:
 *  - Tabel memuat baris pendaftar dari list backend (di-stub via api-client).
 *  - Strip distribusi status (DistributionBar) ter-render di atas tabel.
 *  - Memilih satu baris memunculkan aksi massal (Ajukan/Verifikasi).
 *  - Kolom enrichment (Dokumen ring + Pembayaran dot) bersumber LIVE dari
 *    useDokumenLive/usePembayaranLive (keyed by pendaftaran_ppdb = row.name),
 *    dengan fallback ke mock fixture ketika live kosong untuk baris itu.
 *
 * Backend di-stub via mock @sekolahpro/api-client; hook live di-stub via mock
 * ../../lib/ppdbLive; router di-stub agar komponen dapat dirender tanpa root
 * router penuh (pola sama dengan ppdb.seleksi.test.tsx).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Router di-stub: Link jadi <a>, useParams mengembalikan sekolah uji, dan
// createFileRoute mengembalikan factory no-op, useNavigate jadi no-op.
// useParams memakai slug sekolah NYATA agar fixture mock ter-scope (fallback
// by-name butuh fixture non-kosong). Kedua calon di bawah ada di slug ini.
const TEST_SEKOLAH = "sd-aletheia-malang";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: TEST_SEKOLAH }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

// Baris pendaftaran tiruan — status memakai kosakata backend (PIPELINE_STAGES)
// agar strip distribusi status menghasilkan segmen. Baris pertama punya data
// live (dokumen+pembayaran); baris kedua TIDAK punya data live → fallback mock.
const MOCK_ROWS = [
  {
    name: "PPDB-2026-000001",
    status: "Diverifikasi",
    gelombang_ppdb: "GEL-1",
    calon_siswa: "Arka Pradipta",
    tanggal_daftar: "2026-01-10",
  },
  {
    name: "PPDB-2026-000002",
    status: "Diterima",
    gelombang_ppdb: "GEL-1",
    calon_siswa: "Salsa Nabila",
    tanggal_daftar: "2026-01-12",
  },
];

// api-client di-stub: list mengembalikan baris tiruan; mutasi + create no-op.
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: () => ({
    data: MOCK_ROWS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useResourceCreate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  frappeFetch: vi.fn(),
}));

// auth di-stub: hindari crash useSession tanpa provider (fallback permissif).
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: [] }),
}));

// Hook live di-stub. Default: dokumen+pembayaran hanya untuk baris pertama
// (PPDB-2026-000001) → baris pertama enrichment LIVE, baris kedua fallback mock.
// Test fallback mengganti keduanya jadi kosong via vi.mocked override.
const LIVE_DOKUMEN_ROWS = [
  { name: "DOK-1", pendaftaran_ppdb: "PPDB-2026-000001", jenis: "KK", status: "Diterima" },
  { name: "DOK-2", pendaftaran_ppdb: "PPDB-2026-000001", jenis: "Akta", status: "Belum" },
  { name: "DOK-3", pendaftaran_ppdb: "PPDB-2026-000001", jenis: "Foto", status: "Belum" },
  { name: "DOK-4", pendaftaran_ppdb: "PPDB-2026-000001", jenis: "Rapor", status: "Belum" },
];
const LIVE_PEMBAYARAN_ROWS = [
  {
    name: "PAY-1",
    pendaftaran_ppdb: "PPDB-2026-000001",
    jumlah_tagihan: 250000,
    jumlah_terbayar: 0,
    status: "Tertunda",
  },
];

// Stub HANYA hook live; pertahankan adapter murni (docCompletenessByPendaftaran)
// dari modul asli agar enrichment live benar-benar dihitung dari baris stub.
vi.mock("../../lib/ppdbLive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/ppdbLive")>();
  return {
    ...actual,
    useDokumenLive: vi.fn(() => ({ data: LIVE_DOKUMEN_ROWS })),
    usePembayaranLive: vi.fn(() => ({ data: LIVE_PEMBAYARAN_ROWS })),
  };
});

import { PpdbDaftarPage } from "../sch.$sekolah.ppdb.daftar";
import { useDokumenLive, usePembayaranLive } from "../../lib/ppdbLive";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

/** Locate the table row (`<tr>`) whose No. Pendaftaran link matches `name`. */
function rowFor(name: string): HTMLElement {
  const cell = screen.getByText(name);
  const tr = cell.closest("tr");
  if (!tr) throw new Error(`row for ${name} not found`);
  return tr;
}

describe("PpdbDaftarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default live data after any per-test override.
    vi.mocked(useDokumenLive).mockReturnValue({ data: LIVE_DOKUMEN_ROWS } as never);
    vi.mocked(usePembayaranLive).mockReturnValue({ data: LIVE_PEMBAYARAN_ROWS } as never);
  });
  afterEach(() => cleanup());

  it("merender tabel berisi baris pendaftar dari data backend", () => {
    wrap(<PpdbDaftarPage />);
    // Nomor pendaftaran kedua baris muncul di tabel.
    expect(screen.getByText("PPDB-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("PPDB-2026-000002")).toBeInTheDocument();
  });

  it("merender strip distribusi status (DistributionBar) di atas tabel", () => {
    wrap(<PpdbDaftarPage />);
    // DistributionBar memberi role=img + aria-label diawali "Distribusi".
    expect(
      screen.getByRole("img", { name: /distribusi/i }),
    ).toBeInTheDocument();
  });

  it("memunculkan aksi massal saat satu baris dipilih", () => {
    wrap(<PpdbDaftarPage />);
    // Sebelum memilih: bar aksi massal belum ada.
    expect(
      screen.queryByRole("button", { name: /verifikasi massal/i }),
    ).not.toBeInTheDocument();
    // Centang checkbox baris pertama (checkbox header = index 0, baris = index 1).
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]!);
    // Setelah memilih: tombol aksi massal muncul.
    expect(
      screen.getByRole("button", { name: /verifikasi massal/i }),
    ).toBeInTheDocument();
  });

  it("merender panduan halaman (PageGuide) Cara pakai", () => {
    wrap(<PpdbDaftarPage />);
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("kolom Dokumen memakai kelengkapan LIVE (1/4 diterima) untuk baris dengan data live", () => {
    wrap(<PpdbDaftarPage />);
    // Live: 1 dari 4 dokumen berstatus "Diterima" → ring menampilkan "1/4".
    const row = rowFor("PPDB-2026-000001");
    expect(within(row).getByText("1/4")).toBeInTheDocument();
  });

  it("kolom Pembayaran memakai health LIVE (Tertunda) untuk baris dengan data live", () => {
    wrap(<PpdbDaftarPage />);
    // Live: satu pembayaran berstatus "Tertunda" → dot menampilkan "Tertunda".
    const row = rowFor("PPDB-2026-000001");
    expect(within(row).getByText("Tertunda")).toBeInTheDocument();
  });

  it("baris tanpa data live jatuh ke fallback mock (Dokumen tidak kosong)", () => {
    wrap(<PpdbDaftarPage />);
    // PPDB-2026-000002 ("Salsa Nabila") tak punya baris live → fallback ke mock.
    // Mock "Salsa Nabila" cocok by-name di fixture → kolom Dokumen TIDAK em-dash.
    const row = rowFor("PPDB-2026-000002");
    // Ring fallback menampilkan rasio "n/m" (bukan em-dash "—").
    expect(within(row).getByText(/^\d+\/\d+$/)).toBeInTheDocument();
  });

  it("ketika live kosong total, seluruh enrichment jatuh ke fallback mock (tanpa crash)", () => {
    vi.mocked(useDokumenLive).mockReturnValue({ data: [] } as never);
    vi.mocked(usePembayaranLive).mockReturnValue({ data: [] } as never);
    wrap(<PpdbDaftarPage />);
    // Baris pertama kini juga fallback mock — tetap render rasio dokumen.
    const row = rowFor("PPDB-2026-000001");
    expect(within(row).getByText(/^\d+\/\d+$/)).toBeInTheDocument();
  });
});

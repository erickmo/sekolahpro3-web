/**
 * Pure backend↔view mapping for the Buku detail page (PERP-GAP-13).
 *
 * Extracted from the `$isbn` route so the doctype shapes, status/condition maps,
 * and the row mappers are unit-testable in isolation and the route file reads as
 * composition. No React, no data fetching — all functions are pure.
 */
import type {
  Buku,
  KopiRow,
  PeminjamanRow,
  StatusBuku,
} from "../../data/perpustakaan";

/** `Buku` doctype fields read by the detail page. */
export type BukuDoc = {
  name: string;
  judul?: string;
  isbn?: string;
  pengarang?: string;
  penerbit?: string;
  tahun_terbit?: number;
  kategori?: string;
  deskripsi?: string;
};

/** `Eksemplar Buku` (per-copy) doctype fields. */
export type EksemplarDoc = {
  name: string;
  buku?: string;
  nomor_inventaris?: string;
  kondisi?: "Baik" | "Rusak" | "Hilang";
  status?: "Tersedia" | "Dipinjam" | "Dipesan" | "Tidak Aktif";
};

/** `Peminjaman Buku` doctype fields read by the detail page. */
export type PeminjamanDoc = {
  name: string;
  anggota?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  status?: "Aktif" | "Selesai" | "Terlambat";
};

const KONDISI_MAP: Record<NonNullable<EksemplarDoc["kondisi"]>, KopiRow["kondisi"]> = {
  Baik: "Baik",
  Rusak: "Rusak Ringan",
  Hilang: "Hilang",
};

const EKS_STATUS_MAP: Record<NonNullable<EksemplarDoc["status"]>, StatusBuku> = {
  Tersedia: "Tersedia",
  Dipinjam: "Dipinjam",
  Dipesan: "Dipesan",
  "Tidak Aktif": "Arsip",
};

const PINJ_STATUS_MAP: Record<NonNullable<PeminjamanDoc["status"]>, PeminjamanRow["status"]> = {
  Aktif: "Aktif",
  Selesai: "Dikembalikan",
  Terlambat: "Terlambat",
};

/** Map per-copy eksemplar rows into the view's KopiRow shape. */
export function mapEksemplarToKopi(rows: EksemplarDoc[], fallbackLokasi: KopiRow["lokasi"]): KopiRow[] {
  return rows.map((r) => ({
    kodeKopi: r.nomor_inventaris ?? r.name,
    kondisi: r.kondisi ? KONDISI_MAP[r.kondisi] : "Baik",
    lokasi: fallbackLokasi,
    status: r.status ? EKS_STATUS_MAP[r.status] : "Tersedia",
  }));
}

/** Map loan docs into the view's PeminjamanRow shape. */
export function mapPeminjamanRows(rows: PeminjamanDoc[]): PeminjamanRow[] {
  return rows.map((r) => ({
    id: r.name,
    peminjam: r.anggota ?? "—",
    tanggalPinjam: r.tanggal_pinjam ?? "",
    tanggalKembali: r.tanggal_kembali_rencana ?? "",
    status: r.status ? PINJ_STATUS_MAP[r.status] : "Aktif",
    petugas: "—",
  }));
}

const KATEGORI_SET = new Set<Buku["kategori"]>([
  "Fiksi", "Non-Fiksi", "Pelajaran", "Referensi", "Majalah",
  "Komik", "Biografi", "Sejarah", "Sains", "Agama",
]);
const KATEGORI_FALLBACK: Buku["kategori"] = "Referensi";

/**
 * Coerce a raw backend `kategori` string into the Buku kategori union, so a value
 * outside the union can never leak into a Buku (PERP-GAP-14). The lone `as` is the
 * unavoidable Set.has membership test, scoped to this guard.
 */
export function normalizeKategori(raw: string | undefined): Buku["kategori"] {
  return raw && KATEGORI_SET.has(raw as Buku["kategori"]) ? (raw as Buku["kategori"]) : KATEGORI_FALLBACK;
}

/** Derive a title's aggregate status from its copies' statuses. */
export function deriveStatus(kopi: KopiRow[]): StatusBuku {
  if (kopi.length === 0) return "Arsip";
  if (kopi.some((k) => k.status === "Tersedia")) return "Tersedia";
  if (kopi.some((k) => k.status === "Dipinjam")) return "Dipinjam";
  if (kopi.some((k) => k.status === "Dipesan")) return "Dipesan";
  return "Arsip";
}

/**
 * Build a Buku purely from backend data when no mock fixture exists for this
 * ISBN (e.g. records freshly created via the daftar modal).
 */
export function bukuFromBackend(d: BukuDoc, kopi: KopiRow[], peminjaman: PeminjamanRow[], sekolah: Buku["sekolah"]): Buku {
  const kategori = normalizeKategori(d.kategori);
  const tersedia = kopi.filter((k) => k.status === "Tersedia").length;
  const dipinjam = kopi.filter((k) => k.status === "Dipinjam").length;
  return {
    sekolah,
    isbn: d.isbn ?? d.name,
    kodeBuku: d.name,
    judul: d.judul ?? d.name,
    penulis: d.pengarang ? d.pengarang.split(",").map((s) => s.trim()).filter(Boolean) : [],
    penerbit: d.penerbit ?? "—",
    tahunTerbit: d.tahun_terbit ?? 0,
    kategori,
    bahasa: "Indonesia",
    jumlahHalaman: 0,
    deskripsi: d.deskripsi ?? "—",
    jumlahKopi: kopi.length,
    kopiTersedia: tersedia,
    kopiDipinjam: dipinjam,
    lokasi: "—",
    ratingRata: 0,
    jumlahReview: 0,
    jumlahDipinjam: peminjaman.length,
    ditambahkan: "",
    status: deriveStatus(kopi),
    kopi,
    peminjaman,
    review: [],
    stokTransaksi: [],
    aktivitas: [],
  };
}

/** True when a loan is still outstanding (Aktif or Terlambat). */
export function isActivePinjaman(p: PeminjamanDoc): boolean {
  return p.status === "Aktif" || p.status === "Terlambat";
}

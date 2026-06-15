/**
 * Pure mappers + view-model builder for the Koperasi member-detail page
 * (`/kop/$sekolah/$noAnggota`).
 *
 * Layering: this file owns NO I/O. The route fetches the live Frappe rows
 * (Anggota Koperasi doc, Rekening Simpanan, Produk Simpanan, Transaksi
 * Simpanan, Akad Pembiayaan, Item SHU Anggota) and hands plain arrays to
 * `buildMemberViewModel`, which returns a `MemberViewModel` the tab
 * components render. Kept here so the member-detail route stays a thin
 * renderer (mirrors lib/koperasi/memberActions.ts, akadContract.ts).
 *
 * Replaces the removed mock fixture (data/koperasi.ts findAnggota) that
 * fabricated balances and 404-ed every real member whose id was not one of 35
 * demo rows.
 *
 * Backend field contracts verified 2026-06-15 against sekolahpro/koperasi
 * doctype JSON (anggota_koperasi, simpanan_pokok_wajib, rekening_simpanan,
 * produk_simpanan, transaksi_simpanan, akad_pembiayaan, item_shu_anggota).
 */

import { AKAD_POKOK_FIELD } from "./akadContract";

// ── Live backend row shapes (only the fields we read) ──────────────────────

/** Anggota Koperasi doc; `simpanan_pokok_wajib` is its child table. */
export interface AnggotaDoc {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
  status?: string;
  simpanan_pokok_wajib?: SimpananPokokWajibRow[];
}

/** Child row on Anggota Koperasi — where Pokok/Wajib balances actually live. */
export interface SimpananPokokWajibRow {
  jenis_simpanan?: string; // "Pokok" | "Wajib"
  jumlah?: number;
  status_bayar?: string; // "Belum" | "Lunas"
}

/** Nasabah doc — links to the underlying person via a dynamic link. */
export interface NasabahDoc {
  name: string;
  nomor_nasabah?: string;
  pihak_tipe?: string;
  pihak?: string;
  status?: string;
}

/** Rekening Simpanan list row. */
export interface RekeningRow {
  name: string;
  nomor_rekening?: string;
  produk_simpanan?: string;
  status?: string;
  saldo?: number;
  tanggal_buka?: string;
}

/** Produk Simpanan list row — `jenis` classifies the account type. */
export interface ProdukRow {
  name: string;
  jenis?: string; // Pokok | Wajib | Sukarela | Deposito | Tabungan Berjangka
}

/** Transaksi Simpanan list row. */
export interface TransaksiSimpananRow {
  name: string;
  rekening_simpanan?: string;
  jenis?: string;
  jumlah?: number;
  tanggal?: string;
  keterangan?: string;
  approval_status?: string;
}

/** Akad Pembiayaan list row (financing) — drives the Pinjaman tab. */
export interface AkadRow {
  name: string;
  nomor_akad?: string;
  jumlah_pokok?: number;
  margin_total?: number;
  total_kewajiban?: number;
  tenor?: number;
  tanggal_akad?: string;
  tanggal_jatuh_tempo?: string;
  status?: string;
}

/** Item SHU Anggota child row (per-member profit share). */
export interface ItemShuRow {
  name: string;
  anggota?: string;
  jasa_anggota?: number;
  jasa_modal?: number;
  total_shu?: number;
}

// ── View-model the tab components consume ──────────────────────────────────

export type PinjamanStatus =
  | "Pengajuan" | "Disetujui" | "Berjalan" | "Lunas" | "Macet" | "Ditolak";

export interface MemberPinjamanRow {
  id: string;
  tanggal: string;
  jumlah: number;
  tenor: number;
  bunga: number;
  angsuran: number;
  sisaPokok: number;
  status: PinjamanStatus;
  jatuhTempo: string;
}

export interface MemberRekeningRow {
  id: string;
  nomor: string;
  produk: string;
  jenis: string;
  saldo: number;
  status: string;
}

export interface MemberSimpananTrxRow {
  id: string;
  tanggal: string;
  /** Raw Transaksi Simpanan jenis, e.g. "Setoran", "Bagi Hasil". */
  jenis: string;
  /** Cash direction derived from jenis. */
  tipe: "Setor" | "Tarik";
  jumlah: number;
  approval: string;
  keterangan?: string | undefined;
}

export interface MemberShuRow {
  id: string;
  jasaAnggota: number;
  jasaModal: number;
  totalShu: number;
}

export interface MemberSaldo {
  pokok: number;
  wajib: number;
  sukarela: number;
  berjangka: number;
  total: number;
}

export interface MemberViewModel {
  noAnggota: string;
  nama: string;
  /** jenis_anggota: Anggota | Calon Anggota | Anggota Luar Biasa. */
  tipeAnggota: string;
  /** status: Aktif | Keluar. */
  status: string;
  tanggalGabung: string;
  nasabahId: string | undefined;
  saldo: MemberSaldo;
  rekening: MemberRekeningRow[];
  simpanan: MemberSimpananTrxRow[];
  pinjaman: MemberPinjamanRow[];
  pinjamanAktif: number;
  shu: MemberShuRow[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const JENIS_POKOK = "Pokok";
const JENIS_WAJIB = "Wajib";
const JENIS_SUKARELA = "Sukarela";
/** Produk jenis values that the UI groups under "Berjangka". */
const BERJANGKA_PRODUK_JENIS = new Set(["Deposito", "Tabungan Berjangka"]);
const STATUS_BAYAR_LUNAS = "Lunas";

/** Transaksi Simpanan jenis values that DEBIT the member (money out). */
const TRANSAKSI_DEBIT_JENIS = new Set([
  "Penarikan",
  "Biaya Admin Dormant",
  "Pelunasan Denda Perpus",
]);

/** Akad Pembiayaan status → UI pinjaman status. */
const AKAD_STATUS_MAP: Record<string, PinjamanStatus> = {
  Aktif: "Berjalan",
  Lunas: "Lunas",
  Macet: "Macet",
};

/** Person-doc fields that may carry a human-readable name, in priority order. */
const PERSON_NAME_FIELDS = [
  "nama_lengkap",
  "nama",
  "full_name",
  "employee_name",
  "student_name",
] as const;

// ── Mappers (pure) ─────────────────────────────────────────────────────────

/**
 * Best-effort human name from a person doc reached via Nasabah.pihak. The
 * person doctype varies (Siswa/Pegawai/Wali/User) so we probe known name
 * fields and let the caller fall back to an id when none resolve.
 */
export function resolvePersonName(
  person: Record<string, unknown> | undefined,
): string | undefined {
  if (!person) return undefined;
  for (const field of PERSON_NAME_FIELDS) {
    const value = person[field];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

/**
 * Map Akad Pembiayaan rows into the Pinjaman tab shape. Margin/total are
 * controller-derived; bunga and angsuran are presentation-only estimates.
 */
export function mapAkadToPinjamanRows(rows: AkadRow[]): MemberPinjamanRow[] {
  return rows.map((r) => {
    const pokok = r[AKAD_POKOK_FIELD] ?? 0;
    const margin = r.margin_total ?? 0;
    const tenor = r.tenor ?? 0;
    const totalKewajiban = r.total_kewajiban ?? pokok + margin;
    const bunga = pokok > 0 ? Number(((margin / pokok) * 100).toFixed(2)) : 0;
    const angsuran = tenor > 0 ? Math.floor(totalKewajiban / tenor) : 0;
    const status = AKAD_STATUS_MAP[r.status ?? ""] ?? "Berjalan";
    // No outstanding-principal field on Akad; show full pokok until Lunas.
    const sisaPokok = status === "Lunas" ? 0 : pokok;
    return {
      id: r.nomor_akad ?? r.name,
      tanggal: r.tanggal_akad ?? "",
      jumlah: pokok,
      tenor,
      bunga,
      angsuran,
      sisaPokok,
      status,
      jatuhTempo: r.tanggal_jatuh_tempo ?? "",
    };
  });
}

/** Build a `produk name → jenis` lookup from the Produk Simpanan catalog. */
export function buildProdukJenisMap(produk: ProdukRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of produk) if (p.jenis) map[p.name] = p.jenis;
  return map;
}

/** Map Rekening Simpanan rows for the accounts list, resolving produk jenis. */
export function mapRekeningRows(
  rekening: RekeningRow[],
  produkJenisById: Record<string, string>,
): MemberRekeningRow[] {
  return rekening.map((r) => ({
    id: r.name,
    nomor: r.nomor_rekening ?? r.name,
    produk: r.produk_simpanan ?? "—",
    jenis: (r.produk_simpanan && produkJenisById[r.produk_simpanan]) || "—",
    saldo: r.saldo ?? 0,
    status: r.status ?? "—",
  }));
}

/**
 * Compute saldo per jenis. Pokok/Wajib come from the Anggota child table
 * `simpanan_pokok_wajib` (paid rows only); Sukarela/Berjangka from the
 * member's Rekening Simpanan grouped by produk jenis. Pokok/Wajib rekening
 * (if any) are excluded from Sukarela/Berjangka to avoid double counting.
 */
export function computeSaldoByJenis(
  pokokWajib: SimpananPokokWajibRow[],
  rekening: RekeningRow[],
  produkJenisById: Record<string, string>,
): MemberSaldo {
  const pokok = sumPaid(pokokWajib, JENIS_POKOK);
  const wajib = sumPaid(pokokWajib, JENIS_WAJIB);
  let sukarela = 0;
  let berjangka = 0;
  for (const r of rekening) {
    const jenis = (r.produk_simpanan && produkJenisById[r.produk_simpanan]) || "";
    if (jenis === JENIS_SUKARELA) sukarela += r.saldo ?? 0;
    else if (BERJANGKA_PRODUK_JENIS.has(jenis)) berjangka += r.saldo ?? 0;
  }
  return { pokok, wajib, sukarela, berjangka, total: pokok + wajib + sukarela + berjangka };
}

/** Sum paid (status_bayar = Lunas) child rows of a given jenis. */
function sumPaid(rows: SimpananPokokWajibRow[], jenis: string): number {
  return rows
    .filter((r) => r.jenis_simpanan === jenis && r.status_bayar === STATUS_BAYAR_LUNAS)
    .reduce((acc, r) => acc + (r.jumlah ?? 0), 0);
}

/** Map Transaksi Simpanan rows into the savings-history shape. */
export function mapTransaksiRows(
  rows: TransaksiSimpananRow[],
): MemberSimpananTrxRow[] {
  return rows.map((r) => {
    const jenis = r.jenis ?? "—";
    const row: MemberSimpananTrxRow = {
      id: r.name,
      tanggal: r.tanggal ?? "",
      jenis,
      tipe: TRANSAKSI_DEBIT_JENIS.has(jenis) ? "Tarik" : "Setor",
      jumlah: r.jumlah ?? 0,
      approval: r.approval_status ?? "—",
    };
    if (r.keterangan) row.keterangan = r.keterangan;
    return row;
  });
}

/** Map Item SHU Anggota child rows into the SHU tab shape. */
export function mapShuRows(rows: ItemShuRow[]): MemberShuRow[] {
  return rows.map((r) => ({
    id: r.name,
    jasaAnggota: r.jasa_anggota ?? 0,
    jasaModal: r.jasa_modal ?? 0,
    totalShu: r.total_shu ?? 0,
  }));
}

// ── View-model builder ─────────────────────────────────────────────────────

export interface BuildMemberInput {
  doc: AnggotaDoc;
  nasabah?: NasabahDoc | undefined;
  personName?: string | undefined;
  rekening: RekeningRow[];
  produk: ProdukRow[];
  transaksi: TransaksiSimpananRow[];
  akad: AkadRow[];
  shuItems: ItemShuRow[];
}

/**
 * Assemble the full member view-model from live backend rows. The display
 * name falls back nasabah-person → pihak id → nomor_anggota so a member is
 * never shown a fabricated identity.
 */
export function buildMemberViewModel(input: BuildMemberInput): MemberViewModel {
  const { doc, nasabah, personName, rekening, produk, transaksi, akad, shuItems } = input;
  const produkJenisById = buildProdukJenisMap(produk);
  const saldo = computeSaldoByJenis(doc.simpanan_pokok_wajib ?? [], rekening, produkJenisById);
  const pinjaman = mapAkadToPinjamanRows(akad);
  const pinjamanAktif = pinjaman
    .filter((p) => p.status === "Berjalan" || p.status === "Disetujui")
    .reduce((acc, p) => acc + p.sisaPokok, 0);
  const noAnggota = doc.nomor_anggota ?? doc.name;
  const nama = personName ?? nasabah?.pihak ?? nasabah?.name ?? noAnggota;
  return {
    noAnggota,
    nama,
    tipeAnggota: doc.jenis_anggota ?? "—",
    status: doc.status ?? "—",
    tanggalGabung: doc.tanggal_masuk ?? "",
    nasabahId: doc.nasabah,
    saldo,
    rekening: mapRekeningRows(rekening, produkJenisById),
    simpanan: mapTransaksiRows(transaksi),
    pinjaman,
    pinjamanAktif,
    shu: mapShuRows(shuItems),
  };
}

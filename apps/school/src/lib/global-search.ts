// Client-side global search across mock data fixtures.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

import { SISWA_LIST } from "../data/siswa";
import { PEGAWAI_LIST, isGuru, isStaff } from "../data/pegawai";
import { KELAS_LIST } from "../data/kelas";

export type SearchCategory = "Keuangan" | "Laporan" | "Siswa" | "Guru" | "Staff" | "Kelas";

export type SearchHit = {
  id: string;
  label: string;
  category: SearchCategory;
  meta?: string;
  href: string;
};

const MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_HITS = 8;

function includes(haystack: string | number | undefined | null, needle: string): boolean {
  if (haystack === undefined || haystack === null) return false;
  return String(haystack).toLowerCase().includes(needle);
}

/**
 * Curated finance route+action index for the ⌘K palette ("jump to anything in
 * Keuangan"). `href` is a bare, scope-relative route (scopedTo prepends
 * /sch/$sekolah) — never a query string, so TanStack's typed Link can consume it.
 * `synonyms` carry the verbs/jargon a power user types ("with" -> withholding).
 */
interface FinanceAction {
  label: string;
  href: string;
  synonyms: string[];
}

const FINANCE_ACTIONS: readonly FinanceAction[] = [
  { label: "Terima Pembayaran", href: "/keuangan/pembayaran", synonyms: ["terima bayar", "pembayaran", "bayar spp", "kasir"] },
  { label: "Tagihan SPP & Siswa", href: "/keuangan/tagihan", synonyms: ["tagih", "tagihan", "spp", "invoice"] },
  { label: "Pengeluaran & Persetujuan", href: "/keuangan/pengeluaran", synonyms: ["belanja", "pengeluaran", "expense", "setujui"] },
  { label: "Buku Kas Harian", href: "/keuangan/kas", synonyms: ["buku kas", "kas", "cashbook", "setoran"] },
  { label: "Jurnal Baru", href: "/akuntansi/buku-besar/jurnal/new", synonyms: ["buat jurnal", "jurnal baru", "journal", "posting"] },
  { label: "Jurnal Umum", href: "/akuntansi/buku-besar/jurnal", synonyms: ["jurnal", "journal entry"] },
  { label: "Buku Besar (GL)", href: "/akuntansi/buku-besar/gl", synonyms: ["gl", "general ledger", "buku besar"] },
  { label: "Bagan Akun", href: "/akuntansi/buku-besar/akun", synonyms: ["bagan akun", "akun", "chart of accounts", "coa"] },
  { label: "Realisasi vs Anggaran", href: "/akuntansi/anggaran", synonyms: ["anggaran", "budget", "realisasi"] },
  { label: "Cost Center", href: "/akuntansi/anggaran/cost-center", synonyms: ["cost center", "pusat biaya"] },
  { label: "SPT Masa PPN", href: "/akuntansi/pajak/spt-ppn", synonyms: ["spt", "ppn", "spt ppn", "pajak ppn"] },
  { label: "e-Faktur Export", href: "/akuntansi/pajak/efaktur", synonyms: ["efaktur", "e-faktur", "djp", "csv pajak"] },
  { label: "PPh Withholding", href: "/akuntansi/pajak/withholding", synonyms: ["withholding", "pph", "potong pajak", "pph 23"] },
  { label: "PPh 21 TER", href: "/akuntansi/pajak/ter", synonyms: ["ter", "pph 21", "tarif ter"] },
  { label: "Tutup Periode", href: "/akuntansi/referensi/period", synonyms: ["tutup", "tutup buku", "tutup periode", "close"] },
  { label: "Tahun Fiskal", href: "/akuntansi/referensi/fiscal-year", synonyms: ["tahun fiskal", "fiscal year"] },
] as const;

const FINANCE_MAX_HITS = 6;

/** Whether an action matches the (lowercased) query on label, synonym, or href. */
function financeMatches(action: FinanceAction, q: string): boolean {
  if (action.label.toLowerCase().includes(q)) return true;
  if (action.href.toLowerCase().includes(q)) return true;
  return action.synonyms.some((s) => s.includes(q) || q.includes(s));
}

/**
 * Finance "jump to" hits for a query. Category "Keuangan"; capped so the global
 * palette is not swamped. Returns [] below the minimum query length.
 */
export function financeActions(query: string, max: number = FINANCE_MAX_HITS): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];
  const hits: SearchHit[] = [];
  for (const action of FINANCE_ACTIONS) {
    if (!financeMatches(action, q)) continue;
    hits.push({
      id: `keu:${action.href}`,
      label: action.label,
      category: "Keuangan",
      meta: "Buka halaman",
      href: action.href,
    });
    if (hits.length >= max) break;
  }
  return hits;
}

/**
 * Report-center "jump to" index for the ⌘K palette. Every entry lands on the
 * unified /laporan surface (in-page tabs), so a TU typing "dapodik" or "tpg"
 * reaches Pusat Lapor without hunting through modules. Mirrors {@link financeActions}.
 */
const LAPORAN_ACTIONS: readonly FinanceAction[] = [
  { label: "Pusat Lapor", href: "/laporan", synonyms: ["laporan", "report", "pusat lapor", "lapor"] },
  { label: "Laporan Dapodik", href: "/laporan", synonyms: ["dapodik", "nisn", "data siswa dapodik"] },
  { label: "Rekap Absensi (laporan)", href: "/laporan", synonyms: ["rekap absensi", "absensi report"] },
  { label: "Buku Induk Siswa", href: "/laporan", synonyms: ["buku induk"] },
  { label: "Laporan TPG", href: "/laporan", synonyms: ["tpg", "tunjangan profesi guru"] },
  { label: "Jadwal Laporan Otomatis", href: "/laporan", synonyms: ["jadwal laporan", "laporan terjadwal", "scheduled report"] },
] as const;

const LAPORAN_MAX_HITS = 5;

/** Report-center "jump to" hits for a query. Category "Laporan". */
export function laporanActions(query: string, max: number = LAPORAN_MAX_HITS): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];
  const hits: SearchHit[] = [];
  for (const action of LAPORAN_ACTIONS) {
    if (!financeMatches(action, q)) continue;
    hits.push({
      id: `lap:${action.label}`,
      label: action.label,
      category: "Laporan",
      meta: "Buka Pusat Lapor",
      href: action.href,
    });
    if (hits.length >= max) break;
  }
  return hits;
}

export function globalSearch(query: string, max: number = DEFAULT_MAX_HITS): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];
  const hits: SearchHit[] = [];

  // Finance "jump to" actions rank first so a verb like "withholding" reaches
  // its page without opening the menu; they only appear when they match.
  for (const action of financeActions(q)) {
    hits.push(action);
    if (hits.length >= max) return hits;
  }

  // Report-center jumps rank next to the finance actions.
  for (const action of laporanActions(q)) {
    hits.push(action);
    if (hits.length >= max) return hits;
  }

  for (const s of SISWA_LIST) {
    if (includes(s.namaLengkap, q) || includes(s.nis, q) || includes(s.nisn, q)) {
      hits.push({
        id: `siswa:${s.nis}`,
        label: s.namaLengkap,
        category: "Siswa",
        meta: `NIS ${s.nis}${s.kelas ? " · " + s.kelas : ""}`,
        href: `/siswa/${s.nis}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  for (const p of PEGAWAI_LIST) {
    if (!(includes(p.namaLengkap, q) || includes(p.nip, q))) continue;
    if (isGuru(p)) {
      hits.push({
        id: `pegawai:${p.nip}`,
        label: p.namaLengkap,
        category: "Guru",
        meta: `NIP ${p.nip}`,
        href: `/staff/${p.nip}`,
      });
      if (hits.length >= max) return hits;
    }
    if (isStaff(p)) {
      hits.push({
        id: `pegawai-staff:${p.nip}`,
        label: p.namaLengkap,
        category: "Staff",
        meta: `NIP ${p.nip}`,
        href: `/staff/${p.nip}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  for (const k of KELAS_LIST) {
    if (includes(k.nama, q) || includes(k.kodeKelas, q) || includes(k.waliKelas, q)) {
      hits.push({
        id: `kelas:${k.kodeKelas}`,
        label: k.nama,
        category: "Kelas",
        meta: k.waliKelas ? `Wali: ${k.waliKelas}` : `Kode ${k.kodeKelas}`,
        href: `/kelas/${encodeURIComponent(k.kodeKelas)}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  return hits;
}

export function groupHitsByCategory(hits: SearchHit[]): Array<{ category: SearchCategory; items: SearchHit[] }> {
  const order: SearchCategory[] = ["Keuangan", "Siswa", "Guru", "Staff", "Kelas"];
  return order
    .map((category) => ({
      category,
      items: hits.filter((h) => h.category === category),
    }))
    .filter((g) => g.items.length > 0);
}

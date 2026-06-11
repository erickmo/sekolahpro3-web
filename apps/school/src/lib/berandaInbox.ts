/**
 * "Antrean Saya" inbox selector for the role-adaptive Beranda dashboard.
 *
 * Pure + unit-testable: turns already-loaded live rows / aggregate counts into a
 * single urgency-ranked list of actionable items, each deep-linking to the form
 * that clears it. It only READS and DEEP-LINKS — never mutates a document.
 *
 * COMPOSES (does not copy) lib/keuanganWorkQueue.buildWorkQueue for the per-row
 * finance buckets (bendahara), and ADDS aggregate operational/decision buckets
 * the finance queue does not know about (absensi, berkas, PPDB, pesan, pengganti,
 * kas, rombel-tanpa-wali, SK). The persona selects WHICH buckets appear — honouring
 * the subtraction discipline (a guru never sees finance; a kepala sees decisions,
 * not a transactional worklist).
 */
import { buildWorkQueue, type WorkItem, type WorkSeverity } from "./keuanganWorkQueue";
import type { BerandaRole } from "./berandaRole";
import type { TagihanRow, PengeluaranRow } from "../data/keuangan";

/** Kinds of work a Beranda inbox row can represent (superset of finance WorkType). */
export type BerandaWorkType =
  | "tagihan"
  | "belanja"
  | "pajak"
  | "pembayaran"
  | "absensi"
  | "berkas"
  | "ppdb"
  | "pesan"
  | "pengganti"
  | "kas"
  | "wali"
  | "sk";

/** A single actionable row in the Beranda inbox. */
export interface BerandaWorkItem {
  id: string;
  type: BerandaWorkType;
  label: string;
  /** Short Bahasa Indonesia meta (count / amount hint). */
  meta?: string;
  /** Rupiah amount at stake when relevant (used for secondary sort). */
  amount?: number;
  severity: WorkSeverity;
  /** Deep-link to the page that resolves this work. */
  to: string;
}

/** Already-loaded finance rows for the bendahara per-invoice buckets. */
export interface FinanceInput {
  tagihan: TagihanRow[];
  pengeluaran: PengeluaranRow[];
  sptDraftCount: number;
}

/** Aggregate counts feeding the operational/teaching buckets. */
export interface InboxCounts {
  guruBelumAbsensi?: number;
  pembayaranProses?: number;
  berkasIncompleteSiswa?: number;
  ppdbPendingVerify?: number;
  pesanBelumDibalas?: number;
  penggantiPending?: number;
  pembayaranVerify?: number;
  ppdbPembayaranMasuk?: number;
  absensiPelajaranSayaBelum?: number;
  pesanWaliMurid?: number;
}

/** Decision aggregates for the kepala_sekolah "Keputusan Anda" inbox. */
export interface InboxDecisions {
  rombelTanpaWali?: number;
  skAkanBerakhir?: number;
  tunggakanBesar?: { count: number; total: number };
}

/** Inputs for {@link buildInbox}. Only the role-relevant fields are read. */
export interface BerandaInboxInput {
  /** ISO yyyy-mm-dd, computed once (WIB) by the caller. */
  today: string;
  role: BerandaRole;
  finance?: FinanceInput;
  counts?: InboxCounts;
  decisions?: InboxDecisions;
  kasBelumTutup?: boolean;
}

/** Rupiah total at/above which outstanding arrears are a red, principal-level decision. */
export const TUNGGAKAN_BESAR_THRESHOLD = 10_000_000;

const SEVERITY_RANK: Record<WorkSeverity, number> = { red: 0, amber: 1, emerald: 2 };

const ROUTE_ABSENSI_GURU = "/sch/$sekolah/absensi/guru";
const ROUTE_ABSENSI_PELAJARAN = "/sch/$sekolah/absensi/pelajaran";
const ROUTE_KEUANGAN = "/sch/$sekolah/keuangan";
const ROUTE_PEMBAYARAN = "/sch/$sekolah/keuangan/pembayaran";
const ROUTE_KAS = "/sch/$sekolah/keuangan/kas";
const ROUTE_SISWA = "/sch/$sekolah/siswa/daftar";
const ROUTE_PPDB_PEMBAYARAN = "/sch/$sekolah/akademik/ppdb/pembayaran";
const ROUTE_PESAN = "/sch/$sekolah/pesan";
const ROUTE_KELAS_ROMBEL = "/sch/$sekolah/kelas/rombel";
const ROUTE_SK_MENGAJAR = "/sch/$sekolah/staff/sk-mengajar";
const ROUTE_JADWAL_SLOT = "/sch/$sekolah/jadwal/slot";

/** Map a composed finance WorkItem onto the wider Beranda inbox row shape. */
function fromFinance(items: WorkItem[]): BerandaWorkItem[] {
  return items.map((i) => ({
    id: i.id,
    type: i.type,
    label: i.label,
    meta: i.dueLabel,
    amount: i.amount,
    severity: i.severity,
    to: i.to,
  }));
}

/** Build an aggregate count row, or null when the count is zero/absent (skipped). */
function countRow(
  count: number | undefined,
  row: Omit<BerandaWorkItem, "meta"> & { unit: string },
): BerandaWorkItem | null {
  if (!count || count <= 0) return null;
  const { unit, ...rest } = row;
  return { ...rest, meta: `${count} ${unit}` };
}

/** bendahara: per-invoice finance (composed) + aggregate cash/verify rows. */
function assembleBendahara(input: BerandaInboxInput): BerandaWorkItem[] {
  const out: BerandaWorkItem[] = [];
  if (input.finance) {
    out.push(...fromFinance(buildWorkQueue({ ...input.finance, today: input.today })));
  }
  const c = input.counts ?? {};
  if (input.kasBelumTutup) {
    out.push({ id: "kas-belum-tutup", type: "kas", label: "Tutup kas hari ini belum dilakukan", severity: "red", to: ROUTE_KAS });
  }
  pushIf(out, countRow(c.pembayaranVerify, { id: "pembayaran-verify", type: "pembayaran", label: "Pembayaran menunggu verifikasi", severity: "amber", to: ROUTE_PEMBAYARAN, unit: "pembayaran" }));
  pushIf(out, countRow(c.ppdbPembayaranMasuk, { id: "ppdb-pembayaran-masuk", type: "ppdb", label: "Pembayaran PPDB masuk", severity: "emerald", to: ROUTE_PPDB_PEMBAYARAN, unit: "pembayaran" }));
  return out;
}

/** tu_operator: high-volume operational worklist (aggregate counts). */
function assembleTuOperator(input: BerandaInboxInput): BerandaWorkItem[] {
  const c = input.counts ?? {};
  const out: BerandaWorkItem[] = [];
  pushIf(out, countRow(c.guruBelumAbsensi, { id: "guru-belum-absensi", type: "absensi", label: "Guru belum input absensi", severity: "red", to: ROUTE_ABSENSI_GURU, unit: "guru" }));
  pushIf(out, countRow(c.pembayaranProses, { id: "pembayaran-proses", type: "pembayaran", label: "Pembayaran menunggu proses", severity: "amber", to: ROUTE_KEUANGAN, unit: "transaksi" }));
  pushIf(out, countRow(c.berkasIncompleteSiswa, { id: "berkas-incomplete", type: "berkas", label: "Berkas siswa belum lengkap", severity: "amber", to: ROUTE_SISWA, unit: "siswa" }));
  pushIf(out, countRow(c.ppdbPendingVerify, { id: "ppdb-pending-verify", type: "ppdb", label: "PPDB perlu verifikasi", severity: "amber", to: ROUTE_PPDB_PEMBAYARAN, unit: "pendaftar" }));
  pushIf(out, countRow(c.pesanBelumDibalas, { id: "pesan-belum-dibalas", type: "pesan", label: "Pesan wali belum dibalas", severity: "amber", to: ROUTE_PESAN, unit: "pesan" }));
  pushIf(out, countRow(c.penggantiPending, { id: "pengganti-pending", type: "pengganti", label: "Permintaan guru pengganti", severity: "amber", to: ROUTE_JADWAL_SLOT, unit: "kelas" }));
  return out;
}

/** guru & wali_kelas: teaching records the user must clear (no finance, no decisions). */
function assembleTeaching(input: BerandaInboxInput): BerandaWorkItem[] {
  const c = input.counts ?? {};
  const out: BerandaWorkItem[] = [];
  pushIf(out, countRow(c.absensiPelajaranSayaBelum, { id: "absensi-pelajaran-saya", type: "absensi", label: "Absensi pelajaran belum diinput", severity: "red", to: ROUTE_ABSENSI_PELAJARAN, unit: "kelas" }));
  pushIf(out, countRow(c.penggantiPending, { id: "pengganti-saya", type: "pengganti", label: "Status izin / guru pengganti", severity: "amber", to: ROUTE_JADWAL_SLOT, unit: "jadwal" }));
  pushIf(out, countRow(c.pesanWaliMurid, { id: "pesan-wali-murid", type: "pesan", label: "Pesan dari wali murid", severity: "amber", to: ROUTE_PESAN, unit: "pesan" }));
  return out;
}

/** kepala_sekolah: principal-level decisions (not a transactional worklist). */
function assembleKepala(input: BerandaInboxInput): BerandaWorkItem[] {
  const d = input.decisions ?? {};
  const out: BerandaWorkItem[] = [];
  pushIf(out, countRow(d.rombelTanpaWali, { id: "rombel-tanpa-wali", type: "wali", label: "Rombel tanpa wali kelas", severity: "red", to: ROUTE_KELAS_ROMBEL, unit: "rombel" }));
  pushIf(out, countRow(d.skAkanBerakhir, { id: "sk-akan-berakhir", type: "sk", label: "SK guru/staf akan berakhir 30 hari", severity: "amber", to: ROUTE_SK_MENGAJAR, unit: "SK" }));
  if (d.tunggakanBesar && d.tunggakanBesar.count > 0) {
    const { count, total } = d.tunggakanBesar;
    out.push({
      id: "tunggakan-besar",
      type: "tagihan",
      label: "Tunggakan SPP menumpuk",
      meta: `${count} siswa`,
      amount: total,
      severity: total >= TUNGGAKAN_BESAR_THRESHOLD ? "red" : "amber",
      to: ROUTE_KEUANGAN,
    });
  }
  return out;
}

/** Push a row when present (countRow returns null for zero counts). */
function pushIf(out: BerandaWorkItem[], row: BerandaWorkItem | null): void {
  if (row) out.push(row);
}

/** Stable sort: severity (red → amber → emerald), then amount desc within a tier. */
function bySeverityThenAmount(a: BerandaWorkItem, b: BerandaWorkItem): number {
  const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (sev !== 0) return sev;
  return (b.amount ?? 0) - (a.amount ?? 0);
}

const ASSEMBLERS: Record<BerandaRole, (input: BerandaInboxInput) => BerandaWorkItem[]> = {
  kepala_sekolah: assembleKepala,
  bendahara: assembleBendahara,
  tu_operator: assembleTuOperator,
  guru: assembleTeaching,
  wali_kelas: assembleTeaching,
};

/**
 * Build the persona's urgency-ranked inbox. The role selects which buckets
 * appear; the result is stably sorted by severity then amount. Empty when the
 * persona has no outstanding work.
 */
export function buildInbox(input: BerandaInboxInput): BerandaWorkItem[] {
  const items = ASSEMBLERS[input.role](input);
  return [...items].sort(bySeverityThenAmount);
}

/** Inbox-zero progress: how many rows the user has dismissed/handled. */
export function berandaInboxProgress(
  items: readonly BerandaWorkItem[],
  doneIds: readonly string[],
): { done: number; total: number } {
  const done = new Set(doneIds);
  return { done: items.filter((i) => done.has(i.id)).length, total: items.length };
}

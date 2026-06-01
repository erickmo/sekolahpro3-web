// Pure summary reducers for the Siswa list/sub pages. Each export is a
// (rows) => SummaryItem[] closure built on the shared countBy + toSummary
// helpers, so the route components carry NO counting logic in their JSX — they
// just hand the closure to <ResourceListPage summarize=…>.
//
// Layer: domain helper (no hooks, no I/O). Rows may have missing/blank fields;
// countBy buckets those into "Lainnya" and never throws.
//
// Category fields used here are taken from each page's confirmed `fields`
// array (status / workflow_state / hubungan / status_distribusi).

import { countBy, toSummary, type SummaryItem, type SummaryTone } from "./listSummary";

/** Minimal row shape: every page row has at least a `name`; rest is optional. */
type SummaryRow = Record<string, unknown> & { name: string };

/** Narrow field set for status-keyed summary queries (name + status only). */
export const SISWA_STATUS_FIELDS = ["name", "status"];

/** Narrow field set for workflow_state-keyed summary queries. */
export const SISWA_STATE_FIELDS = ["name", "workflow_state"];

// ── Category orders (known buckets first; unknown labels follow) ───────────────
const STATUS_SISWA_ORDER = ["Calon", "Aktif", "Alumni", "Pindah Keluar", "DO"];
const WORKFLOW_ORDER = ["Draft", "Pending Ka-TU", "Pending Kepsek", "Approved", "Rejected"];
const MUTASI_MASUK_ORDER = ["Diajukan", "Diverifikasi Dapodik", "Diterima", "Ditolak"];
const PENDAFTARAN_ORDER = ["Draft", "Submitted", "Diterima", "Ditolak"];
const CONSENT_ORDER = ["Granted", "Pending", "Withdrawn", "Expired"];
const HUBUNGAN_ORDER = ["Ayah", "Ibu", "Wali"];
const DISTRIBUSI_ORDER = ["Belum Diambil", "Sudah Diambil", "Dikirim"];

// ── Tone palettes (positive=emerald, pending=amber, negative=rose) ─────────────
const STATUS_SISWA_TONES: Record<string, SummaryTone> = {
  Aktif: "emerald",
  Calon: "brand",
  Alumni: "violet",
  "Pindah Keluar": "amber",
  DO: "rose",
};

const WORKFLOW_TONES: Record<string, SummaryTone> = {
  Approved: "emerald",
  Rejected: "rose",
  "Pending Ka-TU": "amber",
  "Pending Kepsek": "amber",
  Draft: "neutral",
};

const MUTASI_MASUK_TONES: Record<string, SummaryTone> = {
  Diterima: "emerald",
  Ditolak: "rose",
  "Diverifikasi Dapodik": "amber",
  Diajukan: "brand",
};

const PENDAFTARAN_TONES: Record<string, SummaryTone> = {
  Diterima: "emerald",
  Ditolak: "rose",
  Submitted: "amber",
  Draft: "neutral",
};

const CONSENT_TONES: Record<string, SummaryTone> = {
  Granted: "emerald",
  Withdrawn: "rose",
  Expired: "amber",
  Pending: "neutral",
};

const HUBUNGAN_TONES: Record<string, SummaryTone> = {
  Ayah: "brand",
  Ibu: "rose",
  Wali: "violet",
};

const DISTRIBUSI_TONES: Record<string, SummaryTone> = {
  "Sudah Diambil": "emerald",
  Dikirim: "emerald",
  "Belum Diambil": "amber",
};

/**
 * Build a status-strip summarizer for one field with a fixed order + tone map.
 * @param field row field to tally
 * @param order known buckets first; unknown labels follow in object order
 * @param tones label->tone map applied to the resulting cells
 * @returns a pure (rows) => SummaryItem[] closure
 */
function makeSummarizer(
  field: string,
  order: string[],
  tones: Record<string, SummaryTone>,
): (rows: SummaryRow[]) => SummaryItem[] {
  return (rows) => toSummary(countBy(rows, field), order, tones);
}

/** Siswa directory: counts per enrolment status (Calon/Aktif/Alumni/…). */
export const summarizeDaftar = makeSummarizer("status", STATUS_SISWA_ORDER, STATUS_SISWA_TONES);

/** Kelulusan: counts per approval workflow_state (Draft → Approved/Rejected). */
export const summarizeKelulusan = makeSummarizer("workflow_state", WORKFLOW_ORDER, WORKFLOW_TONES);

/** Mutasi: counts per approval workflow_state. */
export const summarizeMutasi = makeSummarizer("workflow_state", WORKFLOW_ORDER, WORKFLOW_TONES);

/** Mutasi Masuk: counts per intake status (Diajukan → Diterima/Ditolak). */
export const summarizeMutasiMasuk = makeSummarizer("status", MUTASI_MASUK_ORDER, MUTASI_MASUK_TONES);

/** Pendaftaran: counts per admission status (Draft → Diterima/Ditolak). */
export const summarizePendaftaran = makeSummarizer("status", PENDAFTARAN_ORDER, PENDAFTARAN_TONES);

/** Persetujuan Wali: counts per consent status (Granted/Pending/Withdrawn/Expired). */
export const summarizePersetujuan = makeSummarizer("status", CONSENT_ORDER, CONSENT_TONES);

/** Perubahan Data: counts per approval workflow_state. */
export const summarizePerubahanData = makeSummarizer("workflow_state", WORKFLOW_ORDER, WORKFLOW_TONES);

/** Direktori Wali: counts per relationship (Ayah/Ibu/Wali). */
export const summarizeWali = makeSummarizer("hubungan", HUBUNGAN_ORDER, HUBUNGAN_TONES);

/** Arsip Ijazah: counts per distribution status (Belum/Sudah Diambil/Dikirim). */
export const summarizeIjazah = makeSummarizer("status_distribusi", DISTRIBUSI_ORDER, DISTRIBUSI_TONES);

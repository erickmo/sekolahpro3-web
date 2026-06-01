// Pure summary reducers for the Guru & Staff (Kepegawaian) list pages.
// Each exported `*Summary` is a `summarize` closure handed to ResourceListPage /
// SummaryStrip: it turns ALL base-scoped rows into the labelled StatCard cells.
//
// Layer: domain helper. No hooks, no I/O — composes the generic countBy/toSummary
// (string fields) plus a local countByFlag (0|1 number flags). All row fields are
// optional, so missing values fold into a "Lainnya"/"Non-aktif" bucket, never throw.

import { countBy, toSummary, type SummaryItem, type SummaryTone } from "./listSummary";
import { roleDonut, aktifCount } from "./staffStats";
import type { PegawaiApi } from "../../features/pegawai/roles";

// Field value that marks a flag (aktif / is_aktif) as "active".
const FLAG_ACTIVE = 1;
// Flag-bucket labels.
const LABEL_AKTIF = "Aktif";
const LABEL_NONAKTIF = "Non-aktif";

// SK lifecycle status domain (shared by SK Mengajar + SK Jabatan).
const SK_DITERBITKAN = "Diterbitkan";
const SK_DICABUT = "Dicabut";
// Berkas expiry status domain.
const BERKAS_AKTIF = "Aktif";
const BERKAS_EXPIRED = "Expired";

/**
 * Tally a 0|1 number flag into Aktif / Non-aktif buckets. Anything that is not
 * exactly {@link FLAG_ACTIVE} (incl. 0, undefined, missing) counts as Non-aktif.
 * @param rows source records (may be empty / partially filled)
 * @param field name of the flag field to read
 * @returns both buckets always present; values sum to rows.length; never throws
 */
export function countByFlag<T extends Record<string, unknown>>(
  rows: T[],
  field: string,
): Record<string, number> {
  let aktif = 0;
  for (const row of rows) {
    if (row[field] === FLAG_ACTIVE) aktif += 1;
  }
  return { [LABEL_AKTIF]: aktif, [LABEL_NONAKTIF]: rows.length - aktif };
}

/**
 * Build the strip for a 0|1 flag dimension (Aktif emerald, Non-aktif neutral).
 * Empty input yields [] so the strip hides itself entirely (no all-zero cards).
 * @param rows source records
 * @param field flag field name
 */
function flagSummary<T extends Record<string, unknown>>(rows: T[], field: string): SummaryItem[] {
  if (rows.length === 0) return [];
  return toSummary(countByFlag(rows, field), [LABEL_AKTIF, LABEL_NONAKTIF], {
    [LABEL_AKTIF]: "emerald",
  });
}

/** Jenis Jabatan list strip: Aktif vs Non-aktif by the `aktif` flag. */
export function jabatanSummary<T extends Record<string, unknown>>(rows: T[]): SummaryItem[] {
  return flagSummary(rows, "aktif");
}

// Penugasan status ordering + tones. "Aktif" leads (the live assignments).
const PENUGASAN_ORDER = ["Aktif", "Draft", "Selesai", "Dibatalkan"];
const PENUGASAN_TONES: Record<string, SummaryTone> = {
  Aktif: "emerald",
  Draft: "amber",
  Selesai: "brand",
  Dibatalkan: "rose",
};

/** Penugasan Guru list strip: headcount per `status`. */
export function penugasanSummary<T extends Record<string, unknown>>(rows: T[]): SummaryItem[] {
  if (rows.length === 0) return [];
  return toSummary(countBy(rows, "status"), PENUGASAN_ORDER, PENUGASAN_TONES);
}

// Shared SK status ordering + tones (SK Mengajar & SK Jabatan share the domain).
const SK_ORDER = [SK_DITERBITKAN, "Disetujui Kepsek", "Diajukan", "Draft", SK_DICABUT];
const SK_TONES: Record<string, SummaryTone> = {
  [SK_DITERBITKAN]: "emerald",
  "Disetujui Kepsek": "violet",
  Diajukan: "amber",
  Draft: "neutral",
  [SK_DICABUT]: "rose",
};

/** SK Mengajar / SK Jabatan list strip: headcount per `status`. */
export function skSummary<T extends Record<string, unknown>>(rows: T[]): SummaryItem[] {
  if (rows.length === 0) return [];
  return toSummary(countBy(rows, "status"), SK_ORDER, SK_TONES);
}

// Berkas expiry ordering + tones.
const BERKAS_ORDER = [BERKAS_AKTIF, "Segera Kadaluarsa", BERKAS_EXPIRED];
const BERKAS_TONES: Record<string, SummaryTone> = {
  [BERKAS_AKTIF]: "emerald",
  "Segera Kadaluarsa": "amber",
  [BERKAS_EXPIRED]: "rose",
};

/** Berkas Guru list strip: headcount per `status_expire`. */
export function berkasSummary<T extends Record<string, unknown>>(rows: T[]): SummaryItem[] {
  if (rows.length === 0) return [];
  return toSummary(countBy(rows, "status_expire"), BERKAS_ORDER, BERKAS_TONES);
}

/**
 * Mapel Pengampu list strip: headcount per `mata_pelajaran`. No fixed category
 * order/tone (subjects are open-ended) — natural object order, default tone.
 */
export function mapelPengampuSummary<T extends Record<string, unknown>>(rows: T[]): SummaryItem[] {
  if (rows.length === 0) return [];
  return toSummary(countBy(rows, "mata_pelajaran"));
}

// Pegawai directory strip labels + tones. Role counts are single-sourced from
// roleDonut so dual-role pegawai are never double-counted across Guru/Staff.
const DAFTAR_TOTAL_LABEL = "Total Pegawai";
const DAFTAR_AKTIF_LABEL = "Aktif";
const DAFTAR_ROLE_TONES: Record<string, SummaryTone> = {
  Guru: "emerald",
  Staff: "violet",
  "Dual-role": "amber",
};

/**
 * Pegawai directory strip: total headcount, role breakdown (guru/staff/dual),
 * and active count — all from real counts. Empty input yields [] so the strip
 * hides itself and the onboarding empty-state takes over.
 * @param list pegawai records
 */
export function daftarSummary(list: PegawaiApi[]): SummaryItem[] {
  if (list.length === 0) return [];
  const roleItems: SummaryItem[] = roleDonut(list).map((d) => ({
    label: d.label,
    value: d.value,
    ...(DAFTAR_ROLE_TONES[d.label] ? { tone: DAFTAR_ROLE_TONES[d.label] } : {}),
  }));
  return [
    { label: DAFTAR_TOTAL_LABEL, value: list.length, tone: "brand" },
    ...roleItems,
    { label: DAFTAR_AKTIF_LABEL, value: aktifCount(list), tone: "emerald" },
  ];
}

// Pure, defensive aggregation over PegawaiApi[] for the redesigned
// "Orang / Staff" (Kepegawaian) dashboards. No hooks, no I/O.
//
// Layer: domain helper. The route Page() fetches the pegawai list and passes it
// here; StaffDashboardView consumes the shapes. All PegawaiApi fields are
// optional, so unknowns are bucketed and divisions guard against zero.
//
// Role detection reuses the confirmed helpers in features/pegawai/roles.ts
// (apiIsGuru / apiIsStaff / apiIsDualRole) so role semantics stay single-sourced.

import type { ChartDatum, DistributionSegment, Tone } from "../../components/viz/charts";
import type { AttentionItem } from "@sekolahpro/ui";
import {
  apiIsGuru,
  apiIsStaff,
  apiIsDualRole,
  type PegawaiApi,
} from "../../features/pegawai/roles";

/** Sertifikasi coverage summary (guru population only — see sertifikasiCoverage doc). */
export interface SertifikasiCoverage {
  certified: number;
  total: number;
  pct: number;
}

// Role donut labels + their fixed tones. Tones are typed as Tone (not via a
// Record index access) so they are never `Tone | undefined` under
// exactOptionalPropertyTypes when assigned to ChartDatum.tone.
const ROLE_GURU_LABEL = "Guru";
const ROLE_STAFF_LABEL = "Staff";
const ROLE_DUAL_LABEL = "Dual-role";
const ROLE_GURU_TONE: Tone = "brand";
const ROLE_STAFF_TONE: Tone = "violet";
const ROLE_DUAL_TONE: Tone = "amber";

// Bucket label for any missing status_kepegawaian value.
const STATUS_FALLBACK = "Lainnya";
// is_aktif flag value that marks an active employee.
const AKTIF_FLAG = 1;
// sudah_sertifikasi flag value that marks a certified teacher.
const SERTIFIKASI_FLAG = 1;
// Percentage scale used when computing coverage.
const PERCENT_FULL = 100;
// Confirmed gender domain values.
const GENDER_L = "Laki-laki";
const GENDER_P = "Perempuan";
const UNKNOWN_GENDER = "Tidak diketahui";

/**
 * Role distribution as a DonutChart dataset. Dual-role pegawai are counted once
 * in their own slice (never double-counted in Guru and Staff).
 * @param list pegawai records
 * @returns [] on empty input; tones Guru=brand, Staff=violet, Dual-role=amber
 */
export function roleDonut(list: PegawaiApi[]): ChartDatum[] {
  if (list.length === 0) return [];
  let guru = 0;
  let staff = 0;
  let dual = 0;
  for (const p of list) {
    if (apiIsDualRole(p)) dual += 1;
    else if (apiIsGuru(p)) guru += 1;
    else if (apiIsStaff(p)) staff += 1;
  }
  return [
    { label: ROLE_GURU_LABEL, value: guru, tone: ROLE_GURU_TONE },
    { label: ROLE_STAFF_LABEL, value: staff, tone: ROLE_STAFF_TONE },
    { label: ROLE_DUAL_LABEL, value: dual, tone: ROLE_DUAL_TONE },
  ];
}

/** Normalise a possibly-missing status_kepegawaian into a label or the fallback. */
function statusLabel(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : STATUS_FALLBACK;
}

/**
 * Headcount grouped by status_kepegawaian for a BarChart.
 * @param list pegawai records
 * @returns [] on empty input; missing status grouped under "Lainnya"
 */
export function statusKepegawaianBars(list: PegawaiApi[]): ChartDatum[] {
  if (list.length === 0) return [];
  const counts: Record<string, number> = {};
  for (const p of list) {
    const key = statusLabel(p.status_kepegawaian);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

/**
 * Sertifikasi coverage. Scope = guru only (incl. dual-role), because
 * sertifikasi pendidik applies to teachers; pure staff are excluded so the
 * percentage stays meaningful.
 * @param list pegawai records
 * @returns { certified, total, pct }; pct is 0 when there are no guru (no /0)
 */
export function sertifikasiCoverage(list: PegawaiApi[]): SertifikasiCoverage {
  const guru = list.filter(apiIsGuru);
  const total = guru.length;
  const certified = guru.filter((p) => p.sudah_sertifikasi === SERTIFIKASI_FLAG).length;
  const pct = total === 0 ? 0 : Math.round((certified / total) * PERCENT_FULL);
  return { certified, total, pct };
}

/**
 * Count active pegawai (is_aktif === 1).
 * @param list pegawai records
 * @returns 0 on empty input
 */
export function aktifCount(list: PegawaiApi[]): number {
  return list.filter((p) => p.is_aktif === AKTIF_FLAG).length;
}

/** Bucket a possibly-missing gender into a known label or the unknown bucket. */
function genderLabel(value: string | undefined): string {
  if (value === GENDER_L) return GENDER_L;
  if (value === GENDER_P) return GENDER_P;
  return UNKNOWN_GENDER;
}

/** Resolve the tone for a bucketed gender label. */
function genderTone(label: string): Tone {
  if (label === GENDER_L) return "brand";
  if (label === GENDER_P) return "rose";
  return "neutral";
}

/**
 * Gender breakdown as DistributionSegment[] for a DistributionBar.
 * @param list pegawai records
 * @returns [] on empty input; Laki-laki=brand, Perempuan=rose, unknown=neutral
 */
export function genderSegments(list: PegawaiApi[]): DistributionSegment[] {
  if (list.length === 0) return [];
  const counts: Record<string, number> = {};
  for (const p of list) {
    const key = genderLabel(p.jenis_kelamin);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([label, value]) => ({ label, value, tone: genderTone(label) }));
}

/**
 * Derive a real next-action queue from fields actually present.
 * Each item is emitted only when its count is > 0 (nothing fabricated).
 * @param list pegawai records
 * @returns AttentionItem[] for inactive pegawai and guru belum sertifikasi
 */
export function deriveStaffActionQueue(list: PegawaiApi[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  const nonaktif = list.filter((p) => p.is_aktif !== AKTIF_FLAG).length;
  if (nonaktif > 0) {
    items.push({
      id: "staff-nonaktif",
      tone: "warning",
      label: "Pegawai non-aktif perlu ditinjau",
      description: "Pastikan status & berkas mutasi/pensiun sudah lengkap",
      badge: String(nonaktif),
      actionLabel: "Tinjau",
    });
  }

  const belumSertifikasi = list.filter(
    (p) => apiIsGuru(p) && p.sudah_sertifikasi !== SERTIFIKASI_FLAG,
  ).length;
  if (belumSertifikasi > 0) {
    items.push({
      id: "staff-belum-sertifikasi",
      tone: "info",
      label: "Guru belum sertifikasi",
      description: "Dorong pengajuan sertifikasi pendidik",
      badge: String(belumSertifikasi),
      actionLabel: "Lihat",
    });
  }

  return items;
}

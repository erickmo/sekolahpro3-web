// Pure, defensive aggregation over plain Siswa rows for the redesigned
// "Orang / Siswa" dashboards. No hooks, no I/O — safe to unit-test in isolation.
//
// Layer: domain helper (number-crunching only). The route Page() fetches rows
// via useResourceList and passes them here; the SiswaDashboardView consumes the
// returned shapes. Rows may have missing/undefined fields — every field is
// optional and unknown values are bucketed, never thrown on.
//
// Field names confirmed from src/routes/sch.$sekolah.siswa.daftar.tsx:
//   name, nama_lengkap, nis, nisn, jenjang, tahun_masuk, tanggal_lahir,
//   jenis_kelamin, agama, status.

import type { ChartDatum, DistributionSegment, Tone } from "../../components/viz/charts";
import type { AttentionItem } from "@sekolahpro/ui";

/** A single Siswa record. Only `name` is guaranteed by Frappe; all else optional. */
export interface SiswaRow {
  name: string;
  status?: string;
  jenis_kelamin?: string;
  nama_lengkap?: string;
  jenjang?: string;
  tahun_masuk?: string;
  agama?: string;
}

/** Aggregated counts a Siswa dashboard renders. */
export interface SiswaStats {
  total: number;
  aktif: number;
  byStatus: Record<string, number>;
  byGender: ChartDatum[];
  byJenjang: ChartDatum[];
  byAgama: ChartDatum[];
}

// Bucket label for any missing/blank dimension value.
const UNKNOWN = "Tidak diketahui";
// Status values relevant to counts and the action queue.
const STATUS_AKTIF = "Aktif";
const STATUS_CALON = "Calon";
const STATUS_PINDAH = "Pindah Keluar";
// Confirmed gender domain values.
const GENDER_L = "Laki-laki";
const GENDER_P = "Perempuan";

// Tone per known status; anything else falls back to neutral.
const STATUS_TONE: Record<string, Tone> = {
  Aktif: "emerald",
  Calon: "sky",
  Alumni: "violet",
  "Pindah Keluar": "amber",
  DO: "rose",
};

/** Normalise a possibly-missing string into a trimmed value or the unknown bucket. */
function bucket(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN;
}

/** Tally one string dimension across all rows into a label->count map. */
function tally(rows: SiswaRow[], pick: (r: SiswaRow) => string | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = bucket(pick(row));
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** Convert a label->count map into ChartDatum[], optionally tagging tones. */
function toData(counts: Record<string, number>, tone?: (label: string) => Tone): ChartDatum[] {
  return Object.entries(counts).map(([label, value]) =>
    tone ? { label, value, tone: tone(label) } : { label, value },
  );
}

/** Resolve the gender tone for a bucketed gender label. */
function genderTone(label: string): Tone {
  if (label === GENDER_L) return "brand";
  if (label === GENDER_P) return "rose";
  return "neutral";
}

/**
 * Compute the headline counts for the Siswa dashboard.
 * @param rows raw Siswa records (may be empty / partially filled)
 * @returns zeroed result on empty input; never throws
 */
export function computeSiswaStats(rows: SiswaRow[]): SiswaStats {
  const byStatus = tally(rows, (r) => r.status);
  return {
    total: rows.length,
    aktif: byStatus[STATUS_AKTIF] ?? 0,
    byStatus,
    byGender: toData(tally(rows, (r) => r.jenis_kelamin), genderTone),
    byJenjang: toData(tally(rows, (r) => r.jenjang)),
    byAgama: toData(tally(rows, (r) => r.agama)),
  };
}

/**
 * Gender breakdown as DistributionSegment[] for a DistributionBar.
 * @param rows raw Siswa records
 * @returns [] on empty input; tones: Laki-laki=brand, Perempuan=rose, else neutral
 */
export function genderSegments(rows: SiswaRow[]): DistributionSegment[] {
  if (rows.length === 0) return [];
  const counts = tally(rows, (r) => r.jenis_kelamin);
  return Object.entries(counts).map(([label, value]) => ({ label, value, tone: genderTone(label) }));
}

/**
 * Status breakdown as ChartDatum[] for a DonutChart.
 * @param rows raw Siswa records
 * @returns [] on empty input; known statuses get their tone, else neutral
 */
export function statusDonut(rows: SiswaRow[]): ChartDatum[] {
  if (rows.length === 0) return [];
  const counts = tally(rows, (r) => r.status);
  return toData(counts, (label) => STATUS_TONE[label] ?? "neutral");
}

/**
 * Derive a real next-action queue from the data actually present.
 * Only emits an item when its underlying count is > 0, so nothing is fabricated.
 * @param rows raw Siswa records
 * @returns AttentionItem[] for Calon (activation) and Pindah Keluar (finalisation)
 */
export function deriveActionQueue(rows: SiswaRow[]): AttentionItem[] {
  const byStatus = tally(rows, (r) => r.status);
  const items: AttentionItem[] = [];

  const calon = byStatus[STATUS_CALON] ?? 0;
  if (calon > 0) {
    items.push({
      id: "siswa-calon",
      tone: "info",
      label: "Calon siswa menunggu aktivasi",
      description: "Verifikasi data lalu ubah status menjadi Aktif",
      badge: String(calon),
      actionLabel: "Tinjau",
    });
  }

  const pindah = byStatus[STATUS_PINDAH] ?? 0;
  if (pindah > 0) {
    items.push({
      id: "siswa-pindah-keluar",
      tone: "warning",
      label: "Mutasi keluar perlu difinalisasi",
      description: "Lengkapi surat pindah dan arsip berkas",
      badge: String(pindah),
      actionLabel: "Proses",
    });
  }

  return items;
}

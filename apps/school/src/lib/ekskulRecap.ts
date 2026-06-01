/**
 * Pure aggregations for the Ekstrakurikuler screens (dashboard + raport recap).
 *
 * Kept dependency-free and unit-tested so the percentage/grouping logic is
 * verifiable without rendering — mirrors lib/akademikTrend.ts. The backend owns
 * the authoritative recap snapshot; these helpers drive the live UI display and
 * the dashboard viz.
 */
import type { ChartDatum, DistributionSegment, Tone } from "../components/viz/charts";

export type KehadiranStatus = "Hadir" | "Izin" | "Sakit" | "Alpha";

export interface KehadiranTally {
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpha: number;
}

const EMPTY_TALLY: Readonly<KehadiranTally> = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
const PERSEN_PENUH = 100;
const ONE_DECIMAL = 10;

/** Count attendance rows by status into a fixed four-bucket tally. */
export function tallyKehadiran(
  rows: ReadonlyArray<{ status?: string | undefined }>,
): KehadiranTally {
  const t: KehadiranTally = { ...EMPTY_TALLY };
  for (const r of rows) {
    const s = r.status as KehadiranStatus | undefined;
    if (s && s in t) t[s] += 1;
  }
  return t;
}

/** Total of all four attendance buckets. */
export function totalKehadiran(t: KehadiranTally): number {
  return t.Hadir + t.Izin + t.Sakit + t.Alpha;
}

/**
 * Attendance percent rounded to one decimal. Zero sessions -> 0 (never NaN),
 * matching the backend recap contract.
 */
export function persentaseHadir(hadir: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((hadir / total) * PERSEN_PENUH * ONE_DECIMAL) / ONE_DECIMAL;
}

/** Distribution segments for a stacked attendance bar (viz). */
export function kehadiranSegments(t: KehadiranTally): DistributionSegment[] {
  return [
    { label: "Hadir", value: t.Hadir, tone: "emerald" },
    { label: "Izin", value: t.Izin, tone: "sky" },
    { label: "Sakit", value: t.Sakit, tone: "amber" },
    { label: "Alpha", value: t.Alpha, tone: "rose" },
  ];
}

export interface ProgramRow {
  name: string;
  status?: string | undefined;
  kategori?: string | undefined;
}

export interface ProgramStats {
  total: number;
  aktif: number;
  nonaktif: number;
}

/** Headline program counts for the dashboard stat strip. */
export function programStats(rows: ReadonlyArray<ProgramRow>): ProgramStats {
  let aktif = 0;
  for (const r of rows) if (r.status === "Aktif") aktif += 1;
  return { total: rows.length, aktif, nonaktif: rows.length - aktif };
}

const KATEGORI_TONES: readonly Tone[] = [
  "brand",
  "emerald",
  "amber",
  "violet",
  "sky",
  "rose",
  "neutral",
];

/** Program count per kategori, sorted desc, toned for an HBarChart. */
export function kategoriChart(rows: ReadonlyArray<ProgramRow>): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = (r.kategori ?? "Lainnya").trim() || "Lainnya";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i): ChartDatum => ({
      label,
      value,
      tone: KATEGORI_TONES[i % KATEGORI_TONES.length] ?? "brand",
    }));
}

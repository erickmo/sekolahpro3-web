/**
 * Pure, deterministic analytics for the PPDB dashboard + work-queue views.
 *
 * Two row shapes are handled deliberately:
 *  - Pipeline/trend functions consume BACKEND-shaped rows ({ status },
 *    { tanggal_daftar }) whose status values match PIPELINE_STAGES keys.
 *  - Composition/score/doc functions consume the mock {@link Pendaftar} shape
 *    (camelCase fields) so dashboard previews work before the API lands.
 *
 * No React, DB, or session access — every function is trivially unit-testable.
 * Payment analytics live in ./ppdbPaymentAnalytics and are re-exported here so
 * consumers import everything from one module.
 */
import type {
  ChartDatum,
  DistributionSegment,
  Tone,
} from "../components/viz/charts";
import type { Pendaftar } from "../data/ppdb";
import { PIPELINE_STAGES } from "./ppdbApi";

const PERCENT_MAX = 100;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const DEFAULT_BIN_SIZE = 10;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DOC_STATUS_ACCEPTED = "Diterima";

// PIPELINE_STAGES uses a status-tone vocabulary; charts use a separate Tone
// palette. This map bridges the two so funnel/status viz stay on-brand.
const PIPELINE_TONE_TO_CHART: Record<string, Tone> = {
  neutral: "neutral",
  warning: "amber",
  brand: "brand",
  success: "emerald",
  danger: "rose",
};

// Distinct chart tones cycled for categorical (jalur) distributions.
const CATEGORY_TONES: Tone[] = [
  "brand",
  "emerald",
  "amber",
  "violet",
  "sky",
  "rose",
  "neutral",
];

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Percentage of `value` over `total`, clamped 0..100 (0 when total <= 0). */
function safePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(Math.round((value / total) * PERCENT_MAX), 0, PERCENT_MAX);
}

type StatusRow = { status?: string };

/** Count rows per PIPELINE_STAGES key (unknown/missing statuses ignored). */
function countByStage(rows: StatusRow[]): Map<string, number> {
  const counts = new Map<string, number>(
    PIPELINE_STAGES.map((s) => [s.key, 0]),
  );
  for (const row of rows) {
    const key = row.status;
    // Tally only known stages; foreign statuses are silently dropped.
    if (key !== undefined && counts.has(key)) {
      counts.set(key, counts.get(key)! + 1);
    }
  }
  return counts;
}

/**
 * Funnel datum per PIPELINE_STAGE, in canonical order, with chart-mapped tone.
 * Always returns the full stage set (zeros included) so the funnel is stable.
 */
export function funnelData(rows: StatusRow[]): ChartDatum[] {
  const counts = countByStage(rows);
  return PIPELINE_STAGES.map((stage) => ({
    label: stage.label,
    value: counts.get(stage.key) ?? 0,
    tone: PIPELINE_TONE_TO_CHART[stage.tone] ?? "neutral",
  }));
}

/**
 * Status distribution segments for a stacked bar: only stages with at least one
 * row are emitted (empty stages would render as invisible zero-width slices).
 */
export function statusDistribution(rows: StatusRow[]): DistributionSegment[] {
  const counts = countByStage(rows);
  return PIPELINE_STAGES.filter((s) => (counts.get(s.key) ?? 0) > 0).map(
    (stage) => ({
      label: stage.label,
      value: counts.get(stage.key) ?? 0,
      tone: PIPELINE_TONE_TO_CHART[stage.tone] ?? "neutral",
    }),
  );
}

/**
 * Count pendaftar per jalur, ordered by first appearance, each toned from the
 * cycling category palette. Empty list yields an empty array.
 */
export function jalurDistribution(list: Pendaftar[]): ChartDatum[] {
  const counts = new Map<string, number>();
  // Insertion order preserved so the chart is deterministic for a given list.
  for (const p of list) {
    counts.set(p.jalur, (counts.get(p.jalur) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value], i) => ({
    label,
    value,
    tone: CATEGORY_TONES[i % CATEGORY_TONES.length]!,
  }));
}

/** Local YYYY-MM-DD string for a date (avoids UTC-vs-local boundary skew). */
function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build the trailing `days` window ending at `todayIso` (chronological). */
function buildDayWindow(days: number, todayIso: string): string[] {
  const today = new Date(todayIso);
  const window: string[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(today.getTime() - offset * MS_PER_DAY);
    window.push(toIsoDay(d));
  }
  return window;
}

type DatedRow = { tanggal_daftar?: string };

/**
 * Daily registration counts over the trailing `days` window ending today.
 * Returns chronological points + their day-of-month labels. Rows outside the
 * window, with missing or NaN dates, are ignored.
 */
export function dailyRegistrationTrend(
  rows: DatedRow[],
  days: number,
  todayIso: string,
): { points: number[]; labels: string[] } {
  const window = buildDayWindow(days, todayIso);
  const index = new Map(window.map((iso, i) => [iso, i]));
  const points = new Array<number>(days).fill(0);
  for (const row of rows) {
    const raw = row.tanggal_daftar;
    if (!raw) continue;
    const iso = raw.slice(0, 10); // normalize datetime → date
    const at = index.get(iso);
    // Only count rows landing inside the window; NaN/foreign dates miss the map.
    if (at !== undefined) points[at] = (points[at] ?? 0) + 1;
  }
  // Label = day-of-month only (compact x-axis on a short window).
  const labels = window.map((iso) => iso.slice(8, 10));
  return { points, labels };
}

/** Inclusive count of histogram buckets for the 0..SCORE_MAX range. */
function bucketCount(binSize: number): number {
  return Math.ceil((SCORE_MAX - SCORE_MIN) / binSize);
}

/**
 * Histogram of defined skorTes over 0..100 in `binSize` buckets (default 10).
 * The exact max score (100) folds into the top bucket; undefined scores are
 * skipped. Always returns the full bucket set with zeros where empty.
 */
export function scoreHistogram(
  list: Pendaftar[],
  binSize: number = DEFAULT_BIN_SIZE,
): ChartDatum[] {
  const buckets = bucketCount(binSize);
  const counts = new Array<number>(buckets).fill(0);
  for (const p of list) {
    if (p.skorTes === undefined) continue;
    const score = clamp(p.skorTes, SCORE_MIN, SCORE_MAX);
    // Math.min keeps an exact 100 inside the last bucket instead of overflowing.
    const idx = Math.min(buckets - 1, Math.floor(score / binSize));
    counts[idx] = (counts[idx] ?? 0) + 1;
  }
  return counts.map((value, i) => {
    const lo = i * binSize;
    const hi = i === buckets - 1 ? SCORE_MAX : lo + binSize - 1;
    return { label: `${lo}-${hi}`, value, tone: "brand" };
  });
}

/**
 * Document completeness: accepted ("Diterima") documents over the total.
 * Zero documents yields 0/0 with pct 0 (never NaN).
 */
export function docCompleteness(p: Pendaftar): {
  done: number;
  total: number;
  pct: number;
} {
  const total = p.dokumen.length;
  const done = p.dokumen.filter((d) => d.status === DOC_STATUS_ACCEPTED).length;
  return { done, total, pct: safePercent(done, total) };
}

/**
 * Quota fill: how much of `kuota` is filled by `total` pendaftar.
 * Over-quota clamps pct at 100 and sisa at 0; zero kuota yields pct 0 (no NaN).
 */
export function quotaInfo(
  total: number,
  kuota: number,
): { filled: number; sisa: number; pct: number } {
  const filled = total;
  const sisa = Math.max(0, kuota - total);
  return { filled, sisa, pct: safePercent(total, kuota) };
}

// Re-export payment analytics so consumers import everything from one module.
export {
  paymentSummary,
  paymentStatusDistribution,
  paymentAging,
  type PaymentSummary,
  type AgingRow,
} from "./ppdbPaymentAnalytics";

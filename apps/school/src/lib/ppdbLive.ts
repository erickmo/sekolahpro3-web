/**
 * Live-data layer for the PPDB dashboard: thin useResourceList hooks plus PURE,
 * deterministic adapters that reshape backend list rows / statistik payloads
 * into the viz primitives (ChartDatum / DistributionSegment).
 *
 * Design contract: every page wires these live hooks but ALWAYS falls back to
 * its existing mock-derived value when the live result is empty/undefined, so a
 * blank backend degrades gracefully instead of crashing. The adapters here are
 * the fallback's mirror image — same shapes as ppdbAnalytics, fed from the live
 * DocType fields instead of the mock Pendaftar shape.
 *
 * No React state, DB, or session access in the adapters — trivially unit-tested.
 */
import { useResourceList } from "@sekolahpro/api-client";
import type { ChartDatum, DistributionSegment, Tone } from "../components/viz/charts";
import { PIPELINE_STAGES } from "./ppdbApi";
import type { PaymentSummary } from "./ppdbAnalytics";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const PERCENT_MAX = 100;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const DEFAULT_BIN_SIZE = 10;
const DOC_STATUS_ACCEPTED = "Diterima";

// DocType names — single source so hooks + caches never drift from ppdbApi.
const DOCTYPE_PEMBAYARAN = "Pembayaran PPDB";
const DOCTYPE_DOKUMEN = "Dokumen PPDB";
const DOCTYPE_HASIL_TES = "Hasil Tes Akademik PPDB";

// Whitelisted fields per DocType (must match the verified live wiring).
const PEMBAYARAN_FIELDS = ["name", "pendaftaran_ppdb", "jumlah_tagihan", "jumlah_terbayar", "status"];
const DOKUMEN_FIELDS = ["name", "pendaftaran_ppdb", "jenis", "status"];
const HASIL_TES_FIELDS = ["name", "pendaftaran_ppdb", "jenis_tes", "skor"];

const LIST_LIMIT = 500;
const ORDER_BY_MODIFIED = "`modified` desc";

// PIPELINE_STAGES carries a status-tone vocabulary; charts use the Tone palette.
// This bridges the two so funnel/distribution viz stay on-brand (mirrors
// ppdbAnalytics so live + mock paths render identically).
const PIPELINE_TONE_TO_CHART: Record<string, Tone> = {
  neutral: "neutral",
  warning: "amber",
  brand: "brand",
  success: "emerald",
  danger: "rose",
};

// Distinct chart tones cycled for categorical (jalur) distributions.
const CATEGORY_TONES: Tone[] = ["brand", "emerald", "amber", "violet", "sky", "rose", "neutral"];

// Payment-status labels + tones in display order (matches ppdbPaymentAnalytics).
const PAYMENT_STATUS_TONES: { label: string; tone: Tone }[] = [
  { label: "Lunas", tone: "emerald" },
  { label: "Cicilan", tone: "amber" },
  { label: "Tertunda", tone: "rose" },
];

/* ------------------------------------------------------------------ */
/* Row types                                                          */
/* ------------------------------------------------------------------ */

/** A "Pembayaran PPDB" list row, narrowed to the fields we consume. */
export interface PembayaranLiveRow {
  name: string;
  pendaftaran_ppdb?: string;
  jumlah_tagihan?: number;
  jumlah_terbayar?: number;
  status?: string;
}

/** A "Dokumen PPDB" list row, narrowed to the fields we consume. */
export interface DokumenLiveRow {
  name: string;
  pendaftaran_ppdb?: string;
  jenis?: string;
  status?: string;
}

/** A "Hasil Tes Akademik PPDB" list row, narrowed to the fields we consume. */
export interface HasilTesLiveRow {
  name: string;
  pendaftaran_ppdb?: string;
  jenis_tes?: string;
  skor?: number;
}

/* ------------------------------------------------------------------ */
/* Thin live hooks                                                    */
/* ------------------------------------------------------------------ */

/** Live "Pembayaran PPDB" rows for the active sekolah (whitelisted fields). */
export function usePembayaranLive() {
  return useResourceList<PembayaranLiveRow>(DOCTYPE_PEMBAYARAN, {
    fields: PEMBAYARAN_FIELDS,
    order_by: ORDER_BY_MODIFIED,
    limit_page_length: LIST_LIMIT,
  });
}

/** Live "Dokumen PPDB" rows for the active sekolah (whitelisted fields). */
export function useDokumenLive() {
  return useResourceList<DokumenLiveRow>(DOCTYPE_DOKUMEN, {
    fields: DOKUMEN_FIELDS,
    order_by: ORDER_BY_MODIFIED,
    limit_page_length: LIST_LIMIT,
  });
}

/** Live "Hasil Tes Akademik PPDB" rows for the active sekolah. */
export function useHasilTesLive() {
  return useResourceList<HasilTesLiveRow>(DOCTYPE_HASIL_TES, {
    fields: HASIL_TES_FIELDS,
    order_by: ORDER_BY_MODIFIED,
    limit_page_length: LIST_LIMIT,
  });
}

/* ------------------------------------------------------------------ */
/* Shared math helpers                                                */
/* ------------------------------------------------------------------ */

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Percentage of `value` over `total`, clamped 0..100 (0 when total <= 0). */
function safePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(Math.round((value / total) * PERCENT_MAX), 0, PERCENT_MAX);
}

/* ------------------------------------------------------------------ */
/* Pipeline adapters (statistik per_status → viz)                     */
/* ------------------------------------------------------------------ */

/**
 * Map a statistik `per_status` record onto the canonical PIPELINE_STAGES order,
 * one ChartDatum per stage (zeros included) with its chart-mapped tone. Foreign
 * keys are dropped so the funnel is stable regardless of backend additions.
 */
export function perStatusToFunnel(per: Record<string, number>): ChartDatum[] {
  return PIPELINE_STAGES.map((stage) => ({
    label: stage.label,
    value: per[stage.key] ?? 0,
    tone: PIPELINE_TONE_TO_CHART[stage.tone] ?? "neutral",
  }));
}

/**
 * Same mapping as {@link perStatusToFunnel} but emits ONLY stages with a
 * positive count — zero-width distribution slices would render invisibly.
 */
export function perStatusToDistribution(per: Record<string, number>): DistributionSegment[] {
  return PIPELINE_STAGES.filter((stage) => (per[stage.key] ?? 0) > 0).map((stage) => ({
    label: stage.label,
    value: per[stage.key] ?? 0,
    tone: PIPELINE_TONE_TO_CHART[stage.tone] ?? "neutral",
  }));
}

/* ------------------------------------------------------------------ */
/* Payment adapters (Pembayaran PPDB rows → viz)                      */
/* ------------------------------------------------------------------ */

/**
 * Aggregate billed vs collected across pembayaran rows. outstanding is floored
 * at 0 (over-collection is not negative debt) and pctCollected capped at 100.
 * Empty input yields all-zero (never NaN).
 */
export function paymentSummaryLive(rows: PembayaranLiveRow[]): PaymentSummary {
  let billed = 0;
  let collected = 0;
  for (const row of rows) {
    billed += row.jumlah_tagihan ?? 0;
    collected += row.jumlah_terbayar ?? 0;
  }
  return {
    billed,
    collected,
    outstanding: Math.max(0, billed - collected),
    pctCollected: safePercent(collected, billed),
  };
}

/**
 * Count pembayaran rows per payment status, always returning the full
 * Lunas/Cicilan/Tertunda set (zeros included) so the bar stays stable. Unknown
 * statuses are ignored, never crashed on.
 */
export function paymentStatusDistributionLive(rows: PembayaranLiveRow[]): DistributionSegment[] {
  const counts = new Map<string, number>(PAYMENT_STATUS_TONES.map((s) => [s.label, 0]));
  for (const row of rows) {
    const status = row.status;
    // Tally only known statuses; foreign labels are silently dropped.
    if (status !== undefined && counts.has(status)) {
      counts.set(status, counts.get(status)! + 1);
    }
  }
  return PAYMENT_STATUS_TONES.map((s) => ({
    label: s.label,
    value: counts.get(s.label) ?? 0,
    tone: s.tone,
  }));
}

/* ------------------------------------------------------------------ */
/* Document adapter (Dokumen PPDB rows → completeness)                */
/* ------------------------------------------------------------------ */

/**
 * Per-pendaftaran document completeness: done = status "Diterima" over total.
 * Rows without a pendaftaran_ppdb key are skipped; empty input yields {}.
 */
export function docCompletenessByPendaftaran(
  rows: DokumenLiveRow[],
): Record<string, { done: number; total: number; pct: number }> {
  const totals = new Map<string, { done: number; total: number }>();
  for (const row of rows) {
    const key = row.pendaftaran_ppdb;
    if (!key) continue; // ungrouped docs cannot be attributed — skip.
    const entry = totals.get(key) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (row.status === DOC_STATUS_ACCEPTED) entry.done += 1;
    totals.set(key, entry);
  }
  const out: Record<string, { done: number; total: number; pct: number }> = {};
  for (const [key, { done, total }] of totals) {
    out[key] = { done, total, pct: safePercent(done, total) };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Score histogram (Hasil Tes rows → buckets)                         */
/* ------------------------------------------------------------------ */

/** Inclusive count of histogram buckets for the 0..SCORE_MAX range. */
function bucketCount(binSize: number): number {
  return Math.ceil((SCORE_MAX - SCORE_MIN) / binSize);
}

/**
 * Histogram of defined skor over 0..100 in `binSize` buckets (default 10). The
 * exact max score (100) folds into the top bucket; undefined skor is skipped.
 * Always returns the full bucket set with zeros where empty.
 */
export function scoreHistogramLive(
  rows: HasilTesLiveRow[],
  binSize: number = DEFAULT_BIN_SIZE,
): ChartDatum[] {
  const buckets = bucketCount(binSize);
  const counts = new Array<number>(buckets).fill(0);
  for (const row of rows) {
    if (row.skor === undefined) continue;
    const score = clamp(row.skor, SCORE_MIN, SCORE_MAX);
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

/* ------------------------------------------------------------------ */
/* Jalur distribution (Pendaftaran rows → counts)                     */
/* ------------------------------------------------------------------ */

/**
 * Count rows per jalur in first-appearance order, each toned from the cycling
 * category palette. Rows without a jalur are ignored; empty / all-missing input
 * yields [].
 */
export function jalurDistributionLive(rows: { jalur?: string }[]): ChartDatum[] {
  const counts = new Map<string, number>();
  // Insertion order preserved so the chart is deterministic for a given list.
  for (const row of rows) {
    const jalur = row.jalur;
    if (!jalur) continue;
    counts.set(jalur, (counts.get(jalur) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value], i) => ({
    label,
    value,
    tone: CATEGORY_TONES[i % CATEGORY_TONES.length]!,
  }));
}

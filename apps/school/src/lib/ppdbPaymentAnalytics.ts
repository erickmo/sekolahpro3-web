/**
 * Pure, deterministic payment analytics for the PPDB dashboard.
 *
 * Split out of ppdbAnalytics.ts to keep each module under the 300-line cap.
 * Operates on the mock {@link Pendaftar} shape (camelCase fields). No React,
 * DB, or session access — trivially unit-testable.
 */
import type { DistributionSegment, Tone } from "../components/viz/charts";
import type { Pendaftar, PembayaranPpdbRow } from "../data/ppdb";

const PERCENT_MAX = 100;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Payment-status labels in display order. Centralized so summary + distribution
// + aging never drift apart.
const PAYMENT_STATUS_LUNAS = "Lunas";
const PAYMENT_STATUS_CICILAN = "Cicilan";
const PAYMENT_STATUS_TERTUNDA = "Tertunda";

// Chart tone per payment status — keeps badge colors consistent across viz.
const PAYMENT_STATUS_TONES: { label: string; tone: Tone }[] = [
  { label: PAYMENT_STATUS_LUNAS, tone: "emerald" },
  { label: PAYMENT_STATUS_CICILAN, tone: "amber" },
  { label: PAYMENT_STATUS_TERTUNDA, tone: "rose" },
];

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Percentage of `value` over `total`, clamped to 0..100 (0 when total <= 0). */
function safePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(Math.round((value / total) * PERCENT_MAX), 0, PERCENT_MAX);
}

/** Sum a numeric field across a list, treating negatives as written. */
function sumField(list: Pendaftar[], pick: (p: Pendaftar) => number): number {
  return list.reduce((acc, p) => acc + (pick(p) || 0), 0);
}

export interface PaymentSummary {
  billed: number;
  collected: number;
  outstanding: number;
  pctCollected: number;
}

/**
 * Aggregate billed vs collected across all pendaftar.
 * billed = sum totalBiaya, collected = sum totalDibayar. outstanding never goes
 * negative and pctCollected never exceeds 100 (over-payment is capped).
 */
export function paymentSummary(list: Pendaftar[]): PaymentSummary {
  const billed = sumField(list, (p) => p.totalBiaya);
  const collected = sumField(list, (p) => p.totalDibayar);
  // Outstanding floored at 0: over-collection is not negative debt.
  const outstanding = Math.max(0, billed - collected);
  return {
    billed,
    collected,
    outstanding,
    pctCollected: safePercent(collected, billed),
  };
}

/**
 * Count Lunas / Cicilan / Tertunda across every pembayaran row of every
 * pendaftar. Always returns the full status set (zeros included) so the
 * distribution bar stays stable across renders.
 */
export function paymentStatusDistribution(list: Pendaftar[]): DistributionSegment[] {
  const counts = new Map<string, number>(
    PAYMENT_STATUS_TONES.map((s) => [s.label, 0]),
  );
  for (const p of list) {
    for (const row of p.pembayaran) {
      // Only tally known statuses; unknowns are ignored, not crashed on.
      if (counts.has(row.status)) {
        counts.set(row.status, counts.get(row.status)! + 1);
      }
    }
  }
  return PAYMENT_STATUS_TONES.map((s) => ({
    label: s.label,
    value: counts.get(s.label) ?? 0,
    tone: s.tone,
  }));
}

export interface AgingRow {
  noPendaftaran: string;
  namaLengkap: string;
  jumlah: number;
  hari: number;
}

/** Whole days between an ISO date and today; NaN when the date is invalid. */
function daysBetween(iso: string, todayIso: string): number {
  const then = new Date(iso).getTime();
  const now = new Date(todayIso).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return Number.NaN;
  return Math.floor((now - then) / MS_PER_DAY);
}

/** First Tertunda payment of a pendaftar older than the threshold, if any. */
function overdueRow(
  p: Pendaftar,
  todayIso: string,
  thresholdDays: number,
): AgingRow | null {
  for (const pay of p.pembayaran) {
    if (pay.status !== PAYMENT_STATUS_TERTUNDA) continue;
    const hari = daysBetween(pay.tanggal, todayIso);
    // Skip NaN (invalid date) and anything not yet past the threshold.
    if (Number.isNaN(hari) || hari < thresholdDays) continue;
    return {
      noPendaftaran: p.noPendaftaran,
      namaLengkap: p.namaLengkap,
      jumlah: pay.jumlah,
      hari,
    };
  }
  return null;
}

/**
 * Tertunda payments aged beyond `thresholdDays`, one row per pendaftar (their
 * oldest qualifying tagihan). Invalid dates are ignored, never thrown on.
 */
export function paymentAging(
  list: Pendaftar[],
  todayIso: string,
  thresholdDays: number,
): AgingRow[] {
  const rows: AgingRow[] = [];
  for (const p of list) {
    const row = overdueRow(p, todayIso, thresholdDays);
    if (row) rows.push(row);
  }
  return rows;
}

// Re-export the payment row type for downstream typing convenience.
export type { PembayaranPpdbRow };

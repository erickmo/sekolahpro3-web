/**
 * Live-derivation helper for the Pembayaran PPDB page.
 *
 * Reshapes "Pembayaran PPDB" list rows into the three values the panel needs
 * (gauge summary, donut distribution, aging list). Pure + deterministic — no
 * React, DB, or session access — so it stays trivially unit-testable and keeps
 * the route file under the line cap.
 *
 * Contract: returns null when there are no rows so the caller can fall back to
 * the existing mock-derived analytics (a blank backend degrades gracefully).
 */
import {
  paymentSummaryLive,
  paymentStatusDistributionLive,
  type PembayaranLiveRow,
} from "../../lib/ppdbLive";
import type { AgingRow, PaymentSummary } from "../../lib/ppdbAnalytics";
import type { DistributionSegment } from "../viz/charts";

// Umur tunggakan live tak diketahui (tak ada tanggal di list) → 0 hari.
const LIVE_AGING_DAYS_UNKNOWN = 0;

/** Bundle of live-derived analytics the panel consumes in one render pass. */
export interface PembayaranLiveDerived {
  summary: PaymentSummary;
  distribution: DistributionSegment[];
  aging: AgingRow[];
}

/**
 * Bangun daftar aging dari baris live: satu baris per pendaftaran_ppdb yang
 * belum lunas (jumlah_terbayar < jumlah_tagihan), dengan sisa tagihan sebagai
 * jumlah. Tanpa tanggal di list, umur (hari) dibiarkan 0. Baris tanpa
 * pendaftaran_ppdb diabaikan agar identitas baris tetap stabil.
 */
export function liveAgingFromRows(rows: PembayaranLiveRow[]): AgingRow[] {
  const byPendaftaran = new Map<string, number>();
  for (const row of rows) {
    const key = row.pendaftaran_ppdb;
    if (!key) continue; // baris tak terhubung pendaftaran tak bisa diatribusi.
    const tagihan = row.jumlah_tagihan ?? 0;
    const terbayar = row.jumlah_terbayar ?? 0;
    if (terbayar >= tagihan) continue; // lunas/overpaid bukan tunggakan.
    byPendaftaran.set(key, (byPendaftaran.get(key) ?? 0) + (tagihan - terbayar));
  }
  return [...byPendaftaran.entries()].map(([key, jumlah]) => ({
    noPendaftaran: key,
    namaLengkap: key,
    jumlah,
    hari: LIVE_AGING_DAYS_UNKNOWN,
  }));
}

/**
 * Derive gauge/donut/aging from live rows, or null when there are none so the
 * caller falls back to the mock-derived analytics.
 */
export function derivePembayaranLive(
  rows: PembayaranLiveRow[],
): PembayaranLiveDerived | null {
  if (rows.length === 0) return null;
  return {
    summary: paymentSummaryLive(rows),
    distribution: paymentStatusDistributionLive(rows),
    aging: liveAgingFromRows(rows),
  };
}

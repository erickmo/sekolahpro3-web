/**
 * Pure aggregation helpers that turn the data the Perpustakaan dashboard already
 * fetches (collection rows + loan rows) into shapes the viz primitives consume.
 *
 * No backend calls and no `Date.now()` — the reference date is passed in — so
 * every function is deterministic and unit-testable, mirroring the academic
 * dashboard's `buildTaSegments` approach (visualize from data already in hand).
 */
import type { ChartDatum, DistributionSegment, Tone } from "../viz";

/** Minimal collection row shape needed for category aggregation. */
export interface BukuVizRow {
  kategori?: string | undefined;
}

/** Minimal loan row shape needed for circulation aggregation. */
export interface PinjamVizRow {
  status?: string | undefined;
  tanggal_pinjam?: string | undefined;
}

/** Health summary of currently outstanding loans (for a ProgressRing). */
export interface KesehatanSirkulasi {
  total: number;
  aktif: number;
  terlambat: number;
  percentTepatWaktu: number;
}

const DEFAULT_KATEGORI_TOP_N = 8;
const DEFAULT_RANKING_TOP_N = 5;
const KATEGORI_FALLBACK_LABEL = "Tanpa Kategori";
const DEFAULT_TREN_DAYS = 7;
const PERCENT_MAX = 100;
const MS_PER_DAY = 86_400_000;

/** Tone palette cycled across category bars so adjacent bars stay distinct. */
const KATEGORI_TONES: readonly Tone[] = [
  "brand",
  "violet",
  "sky",
  "emerald",
  "amber",
  "rose",
  "neutral",
];

/** Status label shown in the circulation breakdown + its tone. */
interface SirkulasiBucket {
  label: string;
  tone: Tone;
}

const SIRKULASI_LAINNYA: SirkulasiBucket = { label: "Lainnya", tone: "neutral" };

/**
 * Canonical loan-status buckets in display order. Raw statuses are normalized
 * (e.g. "Dikembalikan" folds into "Selesai"); anything unmatched falls through
 * to {@link SIRKULASI_LAINNYA}.
 */
const SIRKULASI_BUCKETS: ReadonlyArray<{ match: string[]; bucket: SirkulasiBucket }> = [
  { match: ["aktif"], bucket: { label: "Aktif", tone: "brand" } },
  { match: ["terlambat"], bucket: { label: "Terlambat", tone: "amber" } },
  { match: ["selesai", "dikembalikan"], bucket: { label: "Selesai", tone: "emerald" } },
  { match: ["hilang"], bucket: { label: "Hilang", tone: "rose" } },
];

/** Resolve a raw loan status to its display bucket. */
function resolveSirkulasiBucket(status: string | undefined): SirkulasiBucket {
  const normalized = (status ?? "").trim().toLowerCase();
  for (const { match, bucket } of SIRKULASI_BUCKETS) {
    if (match.includes(normalized)) return bucket;
  }
  return SIRKULASI_LAINNYA;
}

/**
 * Count titles per category, sorted by count descending, limited to `topN`.
 * Rows without a category collapse into a single fallback bucket.
 */
export function buildKategoriBars(
  buku: ReadonlyArray<BukuVizRow>,
  topN: number = DEFAULT_KATEGORI_TOP_N,
): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const row of buku) {
    const key = row.kategori && row.kategori.trim() ? row.kategori.trim() : KATEGORI_FALLBACK_LABEL;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value], index) => ({
      label,
      value,
      tone: KATEGORI_TONES[index % KATEGORI_TONES.length]!,
    }));
}

/**
 * Break loans down by canonical status into toned distribution segments,
 * preserving display order and dropping any bucket with no loans.
 */
export function buildSirkulasiSegments(
  pinjam: ReadonlyArray<PinjamVizRow>,
): DistributionSegment[] {
  const counts = new Map<string, number>();
  for (const row of pinjam) {
    const { label } = resolveSirkulasiBucket(row.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const ordered: SirkulasiBucket[] = [...SIRKULASI_BUCKETS.map((b) => b.bucket), SIRKULASI_LAINNYA];
  return ordered
    .filter((b) => (counts.get(b.label) ?? 0) > 0)
    .map((b) => ({ label: b.label, value: counts.get(b.label)!, tone: b.tone }));
}

/** Format an ISO date (yyyy-mm-dd) as a compact "dd/mm" axis label. */
function shortDayLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

/**
 * Build a per-day loan-count series for the `days`-long window ending on
 * `refIso` (inclusive). Loans outside the window are ignored. Index 0 is the
 * oldest day; the last index is `refIso` itself.
 */
export function buildTrenPeminjaman(
  pinjam: ReadonlyArray<PinjamVizRow>,
  refIso: string,
  days: number = DEFAULT_TREN_DAYS,
): ChartDatum[] {
  const refMs = Date.parse(`${refIso}T00:00:00Z`);
  const buckets = new Array<number>(days).fill(0);
  for (const row of pinjam) {
    if (!row.tanggal_pinjam) continue;
    const dayMs = Date.parse(`${row.tanggal_pinjam}T00:00:00Z`);
    if (Number.isNaN(dayMs)) continue;
    const offset = Math.round((refMs - dayMs) / MS_PER_DAY);
    if (offset < 0 || offset >= days) continue;
    const slot = days - 1 - offset;
    buckets[slot] = (buckets[slot] ?? 0) + 1;
  }
  return buckets.map((value, index) => {
    const dayMs = refMs - (days - 1 - index) * MS_PER_DAY;
    const iso = new Date(dayMs).toISOString().slice(0, 10);
    return { label: shortDayLabel(iso), value, tone: "brand" as Tone };
  });
}

/**
 * Summarize outstanding loan health: how many active loans are on time vs
 * overdue. `percentTepatWaktu` is 0 when nothing is outstanding so the UI can
 * render a neutral/empty ring rather than a misleading 100%.
 */
export function computeKesehatanSirkulasi(
  pinjam: ReadonlyArray<PinjamVizRow>,
): KesehatanSirkulasi {
  let aktif = 0;
  let terlambat = 0;
  for (const row of pinjam) {
    const { label } = resolveSirkulasiBucket(row.status);
    if (label === "Aktif") aktif += 1;
    else if (label === "Terlambat") terlambat += 1;
  }
  const total = aktif + terlambat;
  const percentTepatWaktu = total === 0 ? 0 : Math.round((aktif / total) * PERCENT_MAX);
  return { total, aktif, terlambat, percentTepatWaktu };
}

/** Loan row fields needed to rank members and titles (PERP-GAP-15). */
export interface RankingPinjamRow {
  anggota?: string | undefined;
  buku?: string | undefined;
}

/**
 * Count rows by a chosen key, returning the top-`topN` toned bars in descending
 * order. Rows whose key is empty/whitespace are skipped.
 */
function buildRanking(
  rows: ReadonlyArray<RankingPinjamRow>,
  pick: (row: RankingPinjamRow) => string | undefined,
  topN: number,
): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row)?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value], index) => ({
      label,
      value,
      tone: KATEGORI_TONES[index % KATEGORI_TONES.length]!,
    }));
}

/** Top borrowers ranked by number of loans (PERP-GAP-15). */
export function buildTopPeminjam(
  pinjam: ReadonlyArray<RankingPinjamRow>,
  topN: number = DEFAULT_RANKING_TOP_N,
): ChartDatum[] {
  return buildRanking(pinjam, (r) => r.anggota, topN);
}

/** Most-borrowed titles ranked by number of loans (PERP-GAP-15). */
export function buildBukuTerpopuler(
  pinjam: ReadonlyArray<RankingPinjamRow>,
  topN: number = DEFAULT_RANKING_TOP_N,
): ChartDatum[] {
  return buildRanking(pinjam, (r) => r.buku, topN);
}

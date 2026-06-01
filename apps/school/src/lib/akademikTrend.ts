/**
 * Pure aggregation for the academic achievement trend (AKA-20).
 *
 * Turns flat Entri Nilai rows into an ordered per-period series (average final
 * score per tahun ajaran + semester) suitable for a Sparkline. Kept as a pure
 * lib so the period grouping/ordering is unit-tested without rendering the
 * large dashboard route.
 */

/** Minimal row shape needed to build the trend. */
export interface TrendRow {
  tahun_ajaran?: string;
  semester?: string;
  nilai_akhir?: number;
}

/** Ordered trend series: parallel points + human labels (oldest → newest). */
export interface NilaiTrend {
  points: number[];
  labels: string[];
}

/** Keep at most the last N periods so the sparkline stays readable. */
const MAX_TREND_POINTS = 6;
const ROUND_FACTOR = 10;

/** Sort weight for a semester within a tahun ajaran (Ganjil precedes Genap). */
function semesterOrder(semester: string): string {
  if (semester === "Ganjil") return "1";
  if (semester === "Genap") return "2";
  return "0";
}

/**
 * Average `nilai_akhir` per (tahun_ajaran, semester), ordered chronologically
 * and truncated to the most recent {@link MAX_TREND_POINTS} periods. Rows
 * without a numeric nilai_akhir are ignored; periods with no graded rows are
 * dropped.
 */
export function buildNilaiTrend(rows: ReadonlyArray<TrendRow>): NilaiTrend {
  const acc = new Map<string, { sum: number; n: number; label: string; order: string }>();
  for (const r of rows) {
    if (r.nilai_akhir == null || Number.isNaN(r.nilai_akhir)) continue;
    const ta = r.tahun_ajaran || "—";
    const sem = r.semester || "—";
    const key = `${ta}|${sem}`;
    const entry = acc.get(key) ?? {
      sum: 0,
      n: 0,
      label: `${ta} ${sem}`,
      order: `${ta}|${semesterOrder(sem)}`,
    };
    entry.sum += r.nilai_akhir;
    entry.n += 1;
    acc.set(key, entry);
  }
  const ordered = [...acc.values()]
    .sort((a, b) => a.order.localeCompare(b.order))
    .slice(-MAX_TREND_POINTS);
  return {
    points: ordered.map((e) => Math.round((e.sum / e.n) * ROUND_FACTOR) / ROUND_FACTOR),
    labels: ordered.map((e) => e.label),
  };
}

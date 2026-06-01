// Shared formatters for perpustakaan sub-routes (P2).

export function perpFormatRupiah(value: number | undefined | null): string {
  // Reject non-finite values (NaN AND ±Infinity) so a bad division never renders "∞".
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

/**
 * Format an ISO date as a localized id-ID date (e.g. `25 Mei 2026`). PERP-GAP-09
 *
 * Mirrors `formatTanggal` in data/perpustakaan so dates render consistently across
 * the domain. Empty input → em-dash; unparseable input → returned unchanged.
 *
 * @param value an ISO date string, or null/undefined
 */
export function perpFormatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function perpToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calendar-month range for an ISO date (PERP-GAP-08). Returns the month's first
 * day and the first day of the NEXT month, so callers filter with
 * `>= start && < nextStart` without computing a variable month length.
 *
 * @param isoDate an ISO date string `YYYY-MM-DD`
 * @returns `{ start, nextStart }` ISO date strings
 */
export function perpMonthRange(isoDate: string): { start: string; nextStart: string } {
  const ym = isoDate.slice(0, 7);
  const year = Number(ym.slice(0, 4));
  const month = Number(ym.slice(5, 7));
  const start = `${ym}-01`;
  const nextStart =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, nextStart };
}

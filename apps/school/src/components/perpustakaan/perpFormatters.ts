// Shared formatters for perpustakaan sub-routes (P2).

export function perpFormatRupiah(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export function perpFormatDate(value: string | undefined | null): string {
  if (!value) return "—";
  return value;
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

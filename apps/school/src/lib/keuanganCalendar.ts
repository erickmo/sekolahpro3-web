/**
 * Fiscal-deadline computation for the Keuangan hub "Saat Ini Penting" strip.
 *
 * Pure + unit-testable: `today` (ISO yyyy-mm-dd) is passed in, never read from
 * the clock here. Produces the statutory Indonesian tax + month-end-close
 * deadlines so the accountant stops having to remember the 15th/20th windows.
 *
 * DATE-ONLY FALLBACK (load-bearing): the statutory deadlines are derived purely
 * from `today` and ALWAYS returned, even when the optional context (real
 * Accounting/Tax Period docs) is missing or misconfigured — a common state at a
 * school. Optional `ctx.dueDates` are merged on top.
 */

/** Severity bucket driving the strip's colour. */
export type DeadlineSeverity = "red" | "amber" | "emerald";

/** A single deadline shown in the strip. */
export interface Deadline {
  id: string;
  title: string;
  /** ISO yyyy-mm-dd. */
  dueDate: string;
  /** Whole days until due; negative when overdue. */
  daysLeft: number;
  severity: DeadlineSeverity;
  /** Deep-link route to act on the deadline. */
  to: string;
}

/** Optional real-data context layered on top of the statutory fallback. */
export interface DeadlineContext {
  dueDates?: Array<{ id: string; title: string; dueDate: string; to?: string }>;
}

const MS_PER_DAY = 86_400_000;

/** Severity thresholds (whole days). */
const RED_WITHIN_DAYS = 3;
const AMBER_WITHIN_DAYS = 7;

/** Statutory day-of-month deadlines (Indonesia). */
const PPN_REPORT_DAY = 15; // SPT Masa PPN lapor
const PPH_REPORT_DAY = 20; // SPT Masa PPh 21 lapor

const ROUTE_SPT_PPN = "/sch/$sekolah/akuntansi/pajak/spt-ppn";
const ROUTE_WITHHOLDING = "/sch/$sekolah/akuntansi/pajak/withholding";
const ROUTE_TUTUP_BUKU = "/sch/$sekolah/keuangan?close=1";

/** Parse an ISO yyyy-mm-dd into a UTC-midnight Date (TZ-stable). */
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Format a UTC Date back into ISO yyyy-mm-dd. */
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole days from `today` to `due` (negative = overdue). */
function daysBetween(today: Date, due: Date): number {
  return Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);
}

/** Map a day delta to its severity bucket (overdue is always red). */
function severityFor(daysLeft: number): DeadlineSeverity {
  if (daysLeft <= RED_WITHIN_DAYS) return "red";
  if (daysLeft <= AMBER_WITHIN_DAYS) return "amber";
  return "emerald";
}

/**
 * Next occurrence of `dayOfMonth` that is on/after `today`. If the day has
 * already passed this month, roll to the same day next month.
 */
function nextMonthlyDate(today: Date, dayOfMonth: number): Date {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  let candidate = new Date(Date.UTC(year, month, dayOfMonth));
  if (candidate.getTime() < today.getTime()) {
    candidate = new Date(Date.UTC(year, month + 1, dayOfMonth));
  }
  return candidate;
}

/** Last calendar day of `today`'s month (month-end close target). */
function endOfMonth(today: Date): Date {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
}

/** Build a Deadline from a due Date, computing daysLeft + severity. */
function makeDeadline(id: string, title: string, today: Date, due: Date, to: string): Deadline {
  const daysLeft = daysBetween(today, due);
  return { id, title, dueDate: toISO(due), daysLeft, severity: severityFor(daysLeft), to };
}

/**
 * Compute the deadlines to surface today, sorted most-urgent first.
 * Always returns the statutory set (PPN, PPh-21, month-end close) plus any
 * context-supplied due dates.
 */
export function computeDeadlines(today: string, ctx?: DeadlineContext): Deadline[] {
  const t = parseISO(today);

  const deadlines: Deadline[] = [
    makeDeadline("ppn-masa", "Lapor SPT Masa PPN", t, nextMonthlyDate(t, PPN_REPORT_DAY), ROUTE_SPT_PPN),
    makeDeadline("pph-21", "Lapor SPT Masa PPh 21", t, nextMonthlyDate(t, PPH_REPORT_DAY), ROUTE_WITHHOLDING),
    makeDeadline("tutup-buku", "Tutup Buku bulan ini", t, endOfMonth(t), ROUTE_TUTUP_BUKU),
  ];

  for (const extra of ctx?.dueDates ?? []) {
    deadlines.push(
      makeDeadline(extra.id, extra.title, t, parseISO(extra.dueDate), extra.to ?? ROUTE_TUTUP_BUKU),
    );
  }

  return deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
}

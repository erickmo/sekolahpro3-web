/**
 * Pure helpers for the supervisor "Tugas Hari Ini" dashboard worklist.
 *
 * The dashboard derives every actionable count from existing doctypes via
 * useResourceList; these pure functions do the date math, aggregation and
 * label-capping so the route stays a thin renderer and the rules are
 * unit-testable. Dates are passed in (no Date.now() here) so tests are stable.
 */

export interface JadwalAngsuranRow {
  status?: string;
  tanggal_jatuh_tempo?: string;
}

/**
 * True when an installment is unpaid (status Belum) and its due date has
 * already passed. ISO yyyy-mm-dd strings compare correctly lexicographically.
 */
export function isOverdue(row: JadwalAngsuranRow, today: string): boolean {
  if (row.status !== "Belum") return false;
  if (!row.tanggal_jatuh_tempo) return false;
  return row.tanggal_jatuh_tempo < today;
}

export interface ApprovalCount {
  key: string;
  count: number;
}

export interface ApprovalSummary {
  total: number;
  byType: Record<string, number>;
}

/** Total pending approvals plus the per-type breakdown for the inbox tile. */
export function summarizeApprovals(perType: ApprovalCount[]): ApprovalSummary {
  const byType: Record<string, number> = {};
  let total = 0;
  for (const { key, count } of perType) {
    byType[key] = count;
    total += count;
  }
  return { total, byType };
}

/** Count rows per `jenis` (e.g. today's transactions split Setoran/Penarikan/…). */
export function splitTransaksiByJenis(rows: Array<{ jenis: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.jenis] = (out[r.jenis] ?? 0) + 1;
  }
  return out;
}

/**
 * Honest count label when a query is capped at `cap` rows: shows "cap+" so the
 * UI never silently undercounts above the page-length limit.
 */
export function capLabel(count: number, cap: number): string {
  return count >= cap ? `${cap}+` : String(count);
}

const DAY_MS = 86_400_000;

/** Shift an ISO yyyy-mm-dd date by `days` using UTC math so tests stay stable. */
function addDaysIso(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Count unpaid installments (status Belum) due within the next `days` days,
 * today inclusive — the proactive "chase before it becomes tunggakan" number.
 */
export function countDueWithin(rows: JadwalAngsuranRow[], today: string, days: number): number {
  const horizon = addDaysIso(today, days);
  return rows.filter(
    (r) =>
      r.status === "Belum" &&
      !!r.tanggal_jatuh_tempo &&
      r.tanggal_jatuh_tempo >= today &&
      r.tanggal_jatuh_tempo <= horizon,
  ).length;
}

/** Count rows per `status` (e.g. PPATK reports split Draft/Pending Submit/Rejected). */
export function splitByStatus(rows: Array<{ status?: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!r.status) continue;
    out[r.status] = (out[r.status] ?? 0) + 1;
  }
  return out;
}

export interface PeriodeRow {
  status?: string;
  tanggal_akhir?: string;
}

/**
 * True when an operating period is past its planned end date but still not
 * closed (status Open). Open itself is the normal working state — only a
 * past-due Open period is an attention condition (SA review 2026-06-13).
 */
export function isPeriodePastDue(row: PeriodeRow, today: string): boolean {
  if (row.status && row.status !== "Open") return false;
  if (!row.tanggal_akhir) return false;
  return row.tanggal_akhir < today;
}

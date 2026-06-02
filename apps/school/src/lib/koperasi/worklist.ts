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

/** Count rows per `jenis` (e.g. today's transactions split Setor/Tarik/…). */
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

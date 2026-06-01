/**
 * Pure selectors for member-detail quick actions (Setor/Tarik need a target
 * account). Kept here so the 696-line member-detail route stays a renderer and
 * the "which account do we pre-fill" rule is unit-testable.
 */

export interface RekeningPick {
  name: string;
  status?: string;
  tanggal_buka?: string;
}

/**
 * Choose the account to pre-fill for a member: an Aktif account wins; among
 * candidates the most recently opened wins. Falls back to the most recent
 * account of any status. Returns undefined when the member has no account.
 */
export function selectPrimaryRekening(rows: RekeningPick[]): string | undefined {
  if (rows.length === 0) return undefined;
  const aktif = rows.filter((r) => r.status === "Aktif");
  const pool = aktif.length > 0 ? aktif : rows;
  const latest = pool.reduce((best, r) =>
    (r.tanggal_buka ?? "") > (best.tanggal_buka ?? "") ? r : best,
  );
  return latest.name;
}

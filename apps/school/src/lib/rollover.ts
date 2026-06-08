/**
 * Pure payload builder for the year-rollover (Bulk Naik Kelas) drawer.
 *
 * The TU picks a source rombel; every active student defaults to "naik" (promote)
 * and the TU can toggle individuals to "tinggal" (repeat the year). This maps the
 * active list + the held-back set into the shape the existing whitelisted
 * `proses_bulk_naik_kelas(... siswa_naik, siswa_tinggal)` endpoint expects — which
 * generates auditable Mutasi Siswa docs. No new backend.
 */

export interface RolloverPayload {
  siswa_naik: string[];
  siswa_tinggal: string[];
}

/**
 * Split active students into promote / hold-back lists, preserving input order.
 * `tinggal` ids not present in `activeStudents` are ignored.
 */
export function buildRolloverPayload(
  activeStudents: readonly string[],
  tinggal: ReadonlySet<string>,
): RolloverPayload {
  const siswa_naik: string[] = [];
  const siswa_tinggal: string[] = [];
  for (const siswa of activeStudents) {
    if (tinggal.has(siswa)) siswa_tinggal.push(siswa);
    else siswa_naik.push(siswa);
  }
  return { siswa_naik, siswa_tinggal };
}

/**
 * Pure risk-flag collector for the Wali Kelas cockpit "Antrean Perhatian".
 * Scans existing Entri Nilai rows for the roster and surfaces students who have
 * a failing predikat (D) or a remedial mark, grouped per student with reasons.
 * No new backend — reads the existing Entri Nilai doctype.
 */

/** One Entri Nilai row as the cockpit reads it. */
export interface EntriNilaiRow {
  siswa: string;
  mata_pelajaran?: string;
  predikat?: string;
  is_remedial?: 0 | 1 | boolean;
  nilai_akhir?: number;
}

export interface RiskFlag {
  siswa: string;
  reasons: string[];
}

const PREDIKAT_RISIKO = "D";

function rowReason(row: EntriNilaiRow): string | null {
  const mapel = row.mata_pelajaran ?? "mapel";
  if (row.predikat === PREDIKAT_RISIKO) return `Nilai D (${mapel})`;
  if (row.is_remedial) return `Remedial (${mapel})`;
  return null;
}

/** Group at-risk students (predikat D or remedial) with their reasons. */
export function collectRiskFlags(rows: readonly EntriNilaiRow[]): RiskFlag[] {
  const bySiswa = new Map<string, string[]>();
  for (const row of rows) {
    const reason = rowReason(row);
    if (!reason) continue;
    const list = bySiswa.get(row.siswa) ?? [];
    list.push(reason);
    bySiswa.set(row.siswa, list);
  }
  return [...bySiswa.entries()].map(([siswa, reasons]) => ({ siswa, reasons }));
}

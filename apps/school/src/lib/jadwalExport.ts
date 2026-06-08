// jadwalExport — pure CSV builder for the JTM (beban mengajar) rekap.
// Drives the "Export Rekap JTM" download for Dapodik / sertifikasi berkas.
// No DOM, no I/O — the route handles the actual file download.

export interface BebanCsvRow {
  guru: string;
  total_menit: number;
  jtm: number;
}

// Minimum teaching load for the sertifikasi allowance.
const JTM_MINIMAL = 24;

/** Escape a CSV cell (quote when it contains a comma, quote, or newline). */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Build a CSV (Excel-openable) of the JTM rekap per guru, with a status column
 * flagging teachers below the 24-JTM sertifikasi floor.
 */
export function bebanToCsv(rows: readonly BebanCsvRow[]): string {
  const header = ["Guru", "Total Menit", "JTM", "Status"];
  const body = rows.map((r) => [
    r.guru,
    String(r.total_menit),
    String(r.jtm),
    r.jtm >= JTM_MINIMAL ? "Cukup" : "Kurang",
  ]);
  return [header, ...body].map((cols) => cols.map(csvCell).join(",")).join("\n");
}

/**
 * Per-report "run channel" resolver for the Pusat Lapor / Report Center.
 *
 * A report runs through exactly one of three channels (verified against the BE):
 *   - 'engine' — registered in sekolahpro.laporan.engine (the 6 strategic reports);
 *                runs via generate() with watermark + periode + role gating.
 *   - 'dinas'  — in akademik/api/laporan_dinas._REPORT_MAP (TU compliance reports);
 *                runs via export_xlsx / export_data, TU-role-gated. The TU path.
 *   - 'desk'   — neither; only runnable in the native Frappe Desk Report Builder.
 *
 * Mirrors the BE registries so the catalog/Susun Paket can show an honest badge
 * instead of a silently-dead "run" button. Keep in sync with the BE lists.
 */

export type ReportChannel = "engine" | "dinas" | "desk";

/** The 6 reports registered in engine.KNOWN_REPORTS (run via generate()). */
export const ENGINE_REPORTS: readonly string[] = [
  "Rekap Kehadiran",
  "Performance Akademik per Mapel",
  "Neraca Koperasi",
  "Portofolio Pembiayaan",
  "Utilization Perpustakaan",
  "Yayasan Konsolidasi",
];

/** Reports in laporan_dinas._REPORT_MAP (run via the TU-gated Dinas export). */
export const DINAS_REPORTS: readonly string[] = [
  "Rekap Absensi Siswa",
  "Rekap Absensi Guru",
  "Laporan TPG",
  "Data Siswa Dapodik",
  "Buku Induk Siswa",
  "Rekap Siswa per Rombel",
  "Siswa Missing NISN",
];

/** Resolve which channel a report runs through (dinas takes precedence — TU path). */
export function resolveChannel(reportName: string): ReportChannel {
  if (DINAS_REPORTS.includes(reportName)) return "dinas";
  if (ENGINE_REPORTS.includes(reportName)) return "engine";
  return "desk";
}

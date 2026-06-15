/**
 * UI types + pure helpers for the Struktur Biaya (fee structure) screen.
 * Mirrors the vernon_accounting `School Fee Component` doctype shape and the
 * generator summary contract. Mock fixtures keep the page alive offline/demo,
 * matching the pattern in `data/keuangan.ts`.
 */
export type Ritme = "Bulanan" | "Per Semester" | "Sekali";

export interface FeeRate {
  tingkat: number;
  nominal: number;
}

export interface FeeComponent {
  name: string;
  nama_komponen: string;
  ritme: Ritme;
  tahun_ajaran: string;
  jenjang?: string;
  due_day: number;
  auto_generate: boolean;
  is_active: boolean;
  rates: FeeRate[];
}

export interface GenerateSummaryLine {
  nama: string;
  count: number;
  amount: number;
}

export interface GenerateSummary {
  created: number;
  skipped: number;
  total_amount: number;
  by_component: GenerateSummaryLine[];
  warnings: string[];
  errors: string[];
}

/** Reduce a generator summary into the figures the preview modal shows. */
export function summarizePreview(s: GenerateSummary): {
  totalSiswa: number;
  totalRupiah: number;
  lines: GenerateSummaryLine[];
} {
  return { totalSiswa: s.created, totalRupiah: s.total_amount, lines: s.by_component };
}

/**
 * Merge per-component generator summaries into one. The FE generates one
 * component at a time via run_doc_method (no batch endpoint), so the modal
 * folds the results here before previewing/confirming.
 */
export function mergeSummaries(parts: GenerateSummary[]): GenerateSummary {
  return parts.reduce<GenerateSummary>(
    (acc, p) => ({
      created: acc.created + p.created,
      skipped: acc.skipped + p.skipped,
      total_amount: acc.total_amount + p.total_amount,
      by_component: [...acc.by_component, ...p.by_component],
      warnings: [...acc.warnings, ...p.warnings],
      errors: [...acc.errors, ...p.errors],
    }),
    { created: 0, skipped: 0, total_amount: 0, by_component: [], warnings: [], errors: [] },
  );
}

export const MOCK_FEE_COMPONENTS: FeeComponent[] = [
  {
    name: "FEE-demo-SPP",
    nama_komponen: "SPP",
    ritme: "Bulanan",
    tahun_ajaran: "2025/2026",
    due_day: 10,
    auto_generate: true,
    is_active: true,
    rates: [
      { tingkat: 1, nominal: 250000 },
      { tingkat: 2, nominal: 275000 },
    ],
  },
  {
    name: "FEE-demo-Pangkal",
    nama_komponen: "Uang Pangkal",
    ritme: "Sekali",
    tahun_ajaran: "2025/2026",
    due_day: 10,
    auto_generate: false,
    is_active: true,
    rates: [{ tingkat: 1, nominal: 2500000 }],
  },
];

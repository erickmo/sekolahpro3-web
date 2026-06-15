/**
 * Live (Frappe-backed) data for Struktur Biaya. Lists School Fee Component
 * scoped to the active company, and triggers generation through the component's
 * `generate_invoices` doc method via Frappe's standard run_doc_method transport
 * (no bespoke endpoint). Mirrors `data/keuangan-live.ts` (useResourceList).
 */
import { useResourceList, runDocMethod } from "@sekolahpro/api-client";
import { useActiveCompany } from "../lib/akuntansi-scope";
import type { FeeComponent, GenerateSummary, Ritme } from "./fee-structure";

const SCHOOL_FEE_COMPONENT = "School Fee Component";
const GENERATE_DOC_METHOD = "generate_invoices";

export interface FeeRateDoc {
  tingkat: number;
  nominal: number;
}

export interface FeeComponentDoc {
  name: string;
  nama_komponen: string;
  ritme: Ritme;
  tahun_ajaran: string;
  jenjang?: string;
  due_day: number;
  auto_generate: 0 | 1;
  is_active: 0 | 1;
  rates: FeeRateDoc[];
}

const COMPONENT_FIELDS = [
  "name",
  "nama_komponen",
  "ritme",
  "tahun_ajaran",
  "jenjang",
  "due_day",
  "auto_generate",
  "is_active",
];

/** Map a School Fee Component doc onto the UI FeeComponent shape. */
export function mapComponentDoc(doc: FeeComponentDoc): FeeComponent {
  return {
    name: doc.name,
    nama_komponen: doc.nama_komponen,
    ritme: doc.ritme,
    tahun_ajaran: doc.tahun_ajaran,
    ...(doc.jenjang ? { jenjang: doc.jenjang } : {}),
    due_day: doc.due_day,
    auto_generate: Boolean(doc.auto_generate),
    is_active: Boolean(doc.is_active),
    rates: (doc.rates ?? []).map((r) => ({ tingkat: r.tingkat, nominal: r.nominal })),
  };
}

/** Live list of fee components for the active company. */
export function useFeeComponentsLive() {
  const company = useActiveCompany();
  const q = useResourceList<FeeComponentDoc>(SCHOOL_FEE_COMPONENT, {
    fields: COMPONENT_FIELDS,
    filters: company ? [["company", "=", company]] : [],
    order_by: "nama_komponen asc",
    limit_page_length: 0,
  });
  return {
    components: (q.data ?? []).map(mapComponentDoc),
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}

/**
 * Generate invoices for ONE component (dry-run preview or real) through the
 * `generate_invoices` doc method. The route loops selected components and folds
 * the per-component summaries with `mergeSummaries` — keeping generation on the
 * resource/standard API surface (run_doc_method), no custom endpoint.
 */
export function generateForComponent(
  componentName: string,
  periode: string,
  dryRun: boolean,
): Promise<GenerateSummary> {
  return runDocMethod<GenerateSummary>({
    dt: SCHOOL_FEE_COMPONENT,
    dn: componentName,
    method: GENERATE_DOC_METHOD,
    args: { periode, dry_run: dryRun ? 1 : 0 },
  });
}

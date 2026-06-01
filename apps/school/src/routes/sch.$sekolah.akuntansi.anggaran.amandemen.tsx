/**
 * Amandemen Anggaran (Budget Amendment) list page — Keuangan hub.
 *
 * Lists revisions to already-submitted budgets and their workflow state.
 * Presentation-only redesign: adds a concise page guide and a workflow-state
 * distribution visualization derived from the fetched list. Data wiring
 * (useResourceList, DOCTYPE, filters, order_by) is preserved verbatim.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  workflowBadge,
  type BudgetAmendment,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type Tone } from "../components/viz";

/** Map a workflow state to a visualization tone (best-effort by keyword). */
function workflowTone(state: string): Tone {
  const s = state.toLowerCase();
  if (s.includes("approve") || s.includes("setuju") || s.includes("selesai")) return "emerald";
  if (s.includes("reject") || s.includes("tolak")) return "rose";
  if (s.includes("review") || s.includes("pending") || s.includes("tunggu")) return "amber";
  return "neutral";
}

function AmandemenPage() {
  const [q, setQ] = useState("");
  const company = useActiveCompany();
  const list = useResourceList<BudgetAmendment>(DOCTYPE.BUDGET_AMENDMENT, {
    fields: ["name", "budget", "fiscal_year", "company", "workflow_state", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "creation desc",
    limit_page_length: 200,
  });
  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(n) || (r.budget ?? "").toLowerCase().includes(n));
  }, [list.data, q]);

  // Distribusi workflow_state dihitung dari data yang sudah diambil (read-only).
  const workflowDist = useMemo(() => {
    const all = list.data ?? [];
    const counts = new Map<string, number>();
    for (const r of all) {
      const label = r.workflow_state ?? "Draft";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({
      label,
      value,
      tone: workflowTone(label),
    }));
  }, [list.data]);

  const cols: Column<BudgetAmendment>[] = [
    { key: "name", header: "No.", cell: (r) => <span className="font-mono text-xs">{r.name}</span>, width: "180px" },
    { key: "budget", header: "Budget", cell: (r) => r.budget },
    { key: "fiscal_year", header: "FY", cell: (r) => r.fiscal_year ?? "—" },
    { key: "company", header: "Company", cell: (r) => r.company },
    { key: "workflow_state", header: "Workflow", cell: (r) => { const b = workflowBadge(r.workflow_state); return <Badge tone={b.tone}>{b.label}</Badge>; } },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Amandemen Anggaran" description="Revisi alokasi anggaran yang sudah submitted." />

      <KeuanganPageGuide
        storageId="anggaran-amandemen"
        intro="Amandemen dipakai untuk merevisi alokasi anggaran yang sudah submitted, tanpa mengubah budget aslinya. Setiap revisi melewati alur persetujuan (workflow)."
        steps={[
          { title: "Ajukan revisi", detail: "Bendahara membuat amandemen yang merujuk ke budget asli dan menyesuaikan alokasi per akun/bulan." },
          { title: "Tunggu persetujuan", detail: "Amandemen mengikuti workflow_state — pantau status apakah masih review, disetujui, atau ditolak." },
          { title: "Pantau riwayat revisi", detail: "Kepala sekolah dapat melihat berapa banyak revisi yang diajukan dan posisinya pada alur persetujuan.", roles: ["kepala"] },
        ]}
        tips={["Cari berdasarkan nomor amandemen atau nama budget untuk menemukan revisi tertentu dengan cepat."]}
      />

      {workflowDist.length > 0 && (
        <SectionCard title="Distribusi Status Workflow">
          <DistributionBar segments={workflowDist} />
        </SectionCard>
      )}

      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<BudgetAmendment>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada amandemen."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/anggaran/amandemen")({ component: AmandemenPage });

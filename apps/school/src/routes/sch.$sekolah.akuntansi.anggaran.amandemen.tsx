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

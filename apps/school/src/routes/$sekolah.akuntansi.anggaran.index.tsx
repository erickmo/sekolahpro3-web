import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  budgetStatusBadge,
  type Budget,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

function BudgetListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const company = useActiveCompany();

  const list = useResourceList<Budget>(DOCTYPE.BUDGET, {
    fields: ["name", "fiscal_year", "company", "cost_center", "status", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "creation desc",
    limit_page_length: 200,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (status !== "Semua" && r.status !== status) return false;
      if (q) {
        const n = q.toLowerCase();
        if (!r.name.toLowerCase().includes(n) && !(r.fiscal_year ?? "").toLowerCase().includes(n) && !(r.cost_center ?? "").toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [list.data, q, status]);

  const cols: Column<Budget>[] = [
    { key: "name", header: "No.", cell: (r) => (
        <Link to="/$sekolah/akuntansi/anggaran/budget/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
      ), width: "180px" },
    { key: "fiscal_year", header: "Fiscal Year", cell: (r) => r.fiscal_year },
    { key: "cost_center", header: "Cost Center", cell: (r) => r.cost_center ?? "—" },
    { key: "company", header: "Company", cell: (r) => <span className="text-xs">{r.company}</span> },
    { key: "status", header: "Status", cell: (r) => { const b = budgetStatusBadge(r.status); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anggaran"
        description="Budget per cost center, dengan alokasi per bulan."
        actions={
          <Link to="/$sekolah/akuntansi/anggaran/budget/new" params={{ sekolah }}>
            <Button>+ Budget Baru</Button>
          </Link>
        }
      />
      <FilterBar
        search={{ value: q, placeholder: "Cari fiscal year / cost center…", onChange: setQ }}
        filters={[
          {
            key: "status", label: "Status", value: status,
            options: [
              { value: "Semua", label: "Semua" },
              { value: "Draft", label: "Draft" },
              { value: "Submitted", label: "Submitted" },
              { value: "Amended", label: "Amended" },
            ],
            onChange: setStatus,
          },
        ]}
      />
      <SectionCard padded={false}>
        <DataTable<Budget>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada budget."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/anggaran/")({
  component: BudgetListPage,
});

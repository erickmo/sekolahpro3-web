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
import { DOCTYPE, type TaxTemplate } from "../data/akuntansi";

function TaxTemplatePage() {
  const [q, setQ] = useState("");
  const list = useResourceList<TaxTemplate>(DOCTYPE.TAX_TEMPLATE, {
    fields: ["name", "template_name", "company", "is_default"],
    order_by: "name asc",
    limit_page_length: 200,
  });
  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.template_name?.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<TaxTemplate>[] = [
    { key: "name", header: "Nama", cell: (r) => r.template_name },
    { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
    { key: "is_default", header: "Default", cell: (r) => r.is_default ? <Badge tone="success">Default</Badge> : "—", align: "center" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Template" description="Template pajak transaksi (PPN + PPh)." />
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<TaxTemplate>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada template."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/pajak/template")({ component: TaxTemplatePage });

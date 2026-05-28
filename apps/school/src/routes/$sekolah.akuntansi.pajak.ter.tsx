import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  DataTable,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatPercent,
  formatRupiah,
  type PPh21TerRate,
  type PPh4a2Rate,
} from "../data/akuntansi";

function TerPage() {
  const ter = useResourceList<PPh21TerRate>(DOCTYPE.PPH21_TER_RATE, {
    fields: ["name", "category", "income_from", "income_to", "rate"],
    order_by: "category asc, income_from asc",
    limit_page_length: 0,
  });
  const r4a2 = useResourceList<PPh4a2Rate>(DOCTYPE.PPH4A2_RATE, {
    fields: ["name", "kategori", "rate", "keterangan"],
    order_by: "kategori asc",
    limit_page_length: 0,
  });

  const terCols: Column<PPh21TerRate>[] = [
    { key: "category", header: "Kategori", cell: (r) => <Badge tone="brand">{r.category}</Badge>, align: "center", width: "100px" },
    { key: "income_from", header: "Income From", cell: (r) => formatRupiah(r.income_from), align: "right" },
    { key: "income_to", header: "Income To", cell: (r) => formatRupiah(r.income_to), align: "right" },
    { key: "rate", header: "Rate", cell: (r) => formatPercent(r.rate), align: "right" },
  ];
  const r4a2Cols: Column<PPh4a2Rate>[] = [
    { key: "kategori", header: "Kategori", cell: (r) => r.kategori },
    { key: "rate", header: "Rate", cell: (r) => formatPercent(r.rate), align: "right" },
    { key: "keterangan", header: "Keterangan", cell: (r) => <span className="text-xs text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Tarif TER & PPh 4(2)" description="Referensi tarif PMK 168/2023 (TER) dan PPh 4(2)." />
      <SectionCard title="PPh 21 TER Rate" padded={false}>
        <DataTable<PPh21TerRate>
          data={ter.data ?? []} columns={terCols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{ter.isLoading ? "Memuat…" : "Tarif TER kosong."}</div>}
        />
      </SectionCard>
      <SectionCard title="PPh 4(2) Rate" padded={false}>
        <DataTable<PPh4a2Rate>
          data={r4a2.data ?? []} columns={r4a2Cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{r4a2.isLoading ? "Memuat…" : "Tarif 4(2) kosong."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/pajak/ter")({ component: TerPage });

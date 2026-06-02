import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  nama_produk: string;
  mode: string;
  margin_pa?: number;
  skema_angsuran?: string;
  maksimal_tenor?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "nama_produk", header: "Produk", sortable: true, cell: (r) => r.nama_produk },
  { key: "mode", header: "Mode", cell: (r) => <Badge tone="neutral">{r.mode}</Badge> },
  { key: "margin_pa", header: "Bunga/Margin p.a.", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.margin_pa != null ? `${r.margin_pa}%` : "—"}</span> },
  { key: "skema_angsuran", header: "Skema", cell: (r) => r.skema_angsuran ?? "—" },
  { key: "maksimal_tenor", header: "Tenor maks (bln)", align: "right",
    cell: (r) => (r.maksimal_tenor != null ? String(r.maksimal_tenor) : "—") },
];

function SukuBungaPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Suku Bunga"
      description="Daftar suku bunga / margin produk pembiayaan koperasi konvensional."
      doctype="Produk Pembiayaan"
      fields={["name", "nama_produk", "mode", "margin_pa", "skema_angsuran", "maksimal_tenor"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_produk", dir: "asc" }}
      searchFields={["name", "nama_produk"]}
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/suku-bunga")({ component: SukuBungaPage });

import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; ruangan?: string; nama_fasilitas?: string; jumlah?: number; kondisi?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "ruangan", header: "Ruangan", sortable: true, cell: (r) => r.ruangan ?? "—" },
  { key: "nama_fasilitas", header: "Fasilitas", cell: (r) => r.nama_fasilitas ?? "—" },
  { key: "jumlah", header: "Jumlah", align: "right", cell: (r) => r.jumlah ?? "—" },
  { key: "kondisi", header: "Kondisi",
    cell: (r) => <Badge tone={r.kondisi === "Baik" ? "success" : r.kondisi === "Rusak Ringan" ? "warning" : r.kondisi === "Rusak Berat" ? "danger" : "neutral"} dot>{r.kondisi ?? "—"}</Badge> },
];

function FasilitasPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Fasilitas Ruangan"
      doctype="Fasilitas Ruangan"
      fields={["name", "nama_fasilitas", "jumlah", "kondisi"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "asc" }}
      searchFields={["name", "nama_fasilitas"]}
      addLabel="Tambah Fasilitas"
      onAdd={() => alert("Form fasilitas (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/fasilitas")({ component: FasilitasPage });

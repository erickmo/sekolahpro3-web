import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { FasilitasRuanganFormModal } from "../components/infrastruktur/FasilitasRuanganFormModal";

type Row = { name: string; parent?: string; parenttype?: string; nama_fasilitas?: string; jumlah?: number; kondisi?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "parent", header: "Ruangan", sortable: true, cell: (r) => r.parent ?? "—" },
  { key: "nama_fasilitas", header: "Fasilitas", cell: (r) => r.nama_fasilitas ?? "—" },
  { key: "jumlah", header: "Jumlah", align: "right", cell: (r) => r.jumlah ?? "—" },
  { key: "kondisi", header: "Kondisi",
    cell: (r) => <Badge tone={r.kondisi === "Baik" ? "success" : r.kondisi === "Rusak" ? "danger" : "neutral"} dot>{r.kondisi ?? "—"}</Badge> },
];

function FasilitasPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Infrastruktur"
        title="Fasilitas Ruangan"
        doctype="Fasilitas Ruangan"
        fields={["name", "parent", "parenttype", "nama_fasilitas", "jumlah", "kondisi"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "parent", dir: "asc" }}
        searchFields={["name", "nama_fasilitas", "parent"]}
        baseFilters={[["parenttype", "=", "Ruangan"]]}
        addLabel="Tambah Fasilitas"
        onAdd={() => setShowCreate(true)}
      />
      <FasilitasRuanganFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/fasilitas")({ component: FasilitasPage });

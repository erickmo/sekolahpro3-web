import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { GedungFormModal } from "../components/infrastruktur/GedungFormModal";

type Row = { name: string; nama: string; kode?: string; jumlah_lantai?: number; kondisi?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Gedung", sortable: true, cell: (r) => r.nama },
  { key: "kode", header: "Kode", cell: (r) => r.kode ?? "—" },
  { key: "jumlah_lantai", header: "Lantai", align: "right", cell: (r) => r.jumlah_lantai ?? "—" },
  { key: "kondisi", header: "Kondisi", cell: (r) => r.kondisi ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function GedungPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Infrastruktur"
        title="Gedung"
        doctype="Gedung"
        fields={["name", "nama", "kode", "jumlah_lantai", "kondisi", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
        addLabel="Tambah Gedung"
        onAdd={() => setShowCreate(true)}
      />
      <GedungFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/daftar")({ component: GedungPage });

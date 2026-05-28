import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { LantaiFormModal } from "../components/infrastruktur/LantaiFormModal";

type Row = { name: string; gedung?: string; nomor_lantai?: number; nama?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "nomor_lantai", header: "Nomor", align: "right", cell: (r) => r.nomor_lantai ?? "—" },
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
];

function LantaiPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Infrastruktur"
        title="Lantai"
        doctype="Lantai"
        fields={["name", "gedung", "nomor_lantai", "nama"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "gedung", dir: "asc" }}
        searchFields={["name", "gedung"]}
        addLabel="Tambah Lantai"
        onAdd={() => setShowCreate(true)}
      />
      <LantaiFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/lantai")({ component: LantaiPage });

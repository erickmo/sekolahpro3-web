import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { JabatanFormModal } from "../components/staff/JabatanFormModal";

type Row = { name: string; nama_jabatan: string; tingkat?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_jabatan", header: "Nama Jabatan", sortable: true, cell: (r) => r.nama_jabatan },
  { key: "tingkat", header: "Tingkat", cell: (r) => <Badge tone="neutral">{r.tingkat ?? "—"}</Badge> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function StaffJabatanPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Staff"
        title="Jenis Jabatan Staff"
        doctype="Jenis Jabatan"
        fields={["name", "nama_jabatan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_jabatan", dir: "asc" }}
        searchFields={["name", "nama_jabatan"]}
        addLabel="Tambah Jabatan"
        onAdd={() => setShowCreate(true)}
      />
      <JabatanFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/staff/jabatan")({ component: StaffJabatanPage });

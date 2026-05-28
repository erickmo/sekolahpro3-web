import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { JENIS_JABATAN_FIELDS } from "../components/guru-extra/sub-fields";

type Row = { name: string; nama_jabatan: string; tingkat?: string; deskripsi?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_jabatan", header: "Nama Jabatan", sortable: true, cell: (r) => r.nama_jabatan },
  { key: "tingkat", header: "Tingkat", cell: (r) => <Badge tone="neutral">{r.tingkat ?? "—"}</Badge> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function JabatanPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="Jenis Jabatan"
        doctype="Jenis Jabatan"
        fields={["name", "nama_jabatan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_jabatan", dir: "asc" }}
        searchFields={["name", "nama_jabatan"]}
        addLabel="Tambah Jabatan"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Jenis Jabatan"
        title="Tambah Jenis Jabatan"
        fields={JENIS_JABATAN_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/guru/jabatan")({ component: JabatanPage });

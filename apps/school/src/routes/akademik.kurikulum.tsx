import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = { name: string; nama: string; tahun_berlaku?: string; jenjang?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Kurikulum", sortable: true, cell: (r) => r.nama },
  { key: "tahun_berlaku", header: "Tahun Berlaku", cell: (r) => r.tahun_berlaku ?? "—" },
  { key: "jenjang", header: "Jenjang", cell: (r) => r.jenjang ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

const FIELDS: FieldSpec[] = [
  { name: "nama", label: "Nama Kurikulum", required: true, colSpan: 2 },
  { name: "tahun_berlaku", label: "Tahun Berlaku", placeholder: "2024/2025" },
  { name: "jenjang", label: "Jenjang", kind: "select", options: [
    { value: "TK", label: "TK" }, { value: "SD", label: "SD" }, { value: "SMP", label: "SMP" }, { value: "SMA", label: "SMA" },
  ]},
  { name: "status", label: "Status", kind: "select", defaultValue: "Aktif", options: [
    { value: "Aktif", label: "Aktif" }, { value: "Nonaktif", label: "Nonaktif" },
  ]},
];

function KurikulumPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Kurikulum"
        doctype="Kurikulum"
        fields={["name", "nama", "tahun_berlaku"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tahun_berlaku", dir: "desc" }}
        searchFields={["name", "nama"]}
        addLabel="Tambah Kurikulum"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(r) => navigate({ to: "/akademik/kurikulum/$name", params: { name: r.name } })}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Kurikulum"
        title="Tambah Kurikulum"
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/akademik/kurikulum")({ component: KurikulumPage });

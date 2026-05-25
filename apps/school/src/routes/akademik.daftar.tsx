import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = { name: string; nama_mapel: string; kode_mapel: string; kelompok?: string; jenjang?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "kode_mapel", header: "Kode", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.kode_mapel}</span> },
  { key: "nama_mapel", header: "Nama Mata Pelajaran", sortable: true, cell: (r) => r.nama_mapel },
  { key: "kelompok", header: "Kelompok", cell: (r) => r.kelompok ?? "—" },
  { key: "jenjang", header: "Jenjang", cell: (r) => r.jenjang ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

const FIELDS: FieldSpec[] = [
  { name: "nama_mapel", label: "Nama Mata Pelajaran", required: true, colSpan: 2 },
  { name: "kode_mapel", label: "Kode", required: true, placeholder: "MAT-01" },
  { name: "kelompok", label: "Kelompok", kind: "select", options: [
    { value: "Wajib", label: "Wajib" },
    { value: "Peminatan", label: "Peminatan" },
    { value: "Muatan Lokal", label: "Muatan Lokal" },
  ]},
  { name: "jenjang", label: "Jenjang", kind: "select", options: [
    { value: "TK", label: "TK" }, { value: "SD", label: "SD" }, { value: "SMP", label: "SMP" }, { value: "SMA", label: "SMA" },
  ]},
  { name: "status", label: "Status", kind: "select", defaultValue: "Aktif", options: [
    { value: "Aktif", label: "Aktif" }, { value: "Nonaktif", label: "Nonaktif" },
  ]},
];

function MapelPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Mata Pelajaran"
        doctype="Mata Pelajaran"
        fields={["name", "nama_mapel", "kode_mapel", "kelompok", "jenjang", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "kode_mapel", dir: "asc" }}
        searchFields={["name", "nama_mapel", "kode_mapel"]}
        addLabel="Tambah Mapel"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(r) => navigate({ to: "/akademik/mapel/$name", params: { name: r.name } })}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Mata Pelajaran"
        title="Tambah Mata Pelajaran"
        description="Buat entri mata pelajaran baru."
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/akademik/daftar")({ component: MapelPage });

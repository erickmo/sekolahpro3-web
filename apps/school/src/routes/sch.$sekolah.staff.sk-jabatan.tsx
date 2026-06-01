import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SkJabatanFormModal } from "../components/staff/SkJabatanFormModal";

type Row = {
  name: string;
  guru: string;
  guru_nama?: string;
  jenis_jabatan?: string;
  nomor_sk_manual?: string;
  tanggal_sk?: string;
  status?: string;
};

function skTone(status?: string): "success" | "danger" | "warning" | "neutral" {
  if (status === "Diterbitkan") return "success";
  if (status === "Dicabut") return "danger";
  if (status === "Diajukan" || status === "Disetujui Kepsek") return "warning";
  return "neutral";
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Pegawai", sortable: true, cell: (r) => r.guru_nama ?? r.guru },
  { key: "jenis_jabatan", header: "Jabatan", cell: (r) => r.jenis_jabatan ?? "—" },
  { key: "nomor_sk_manual", header: "No. SK", cell: (r) => <span className="font-mono text-xs">{r.nomor_sk_manual ?? "—"}</span> },
  { key: "tanggal_sk", header: "Tgl SK", sortable: true, cell: (r) => r.tanggal_sk ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={skTone(r.status)} dot>{r.status ?? "—"}</Badge> },
];

function StaffSkJabatanPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Staff"
        title="SK Jabatan Staff"
        doctype="SK Jabatan"
        fields={["name", "guru", "guru_nama", "jenis_jabatan", "nomor_sk_manual", "tanggal_sk", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_sk", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Terbitkan SK"
        onAdd={() => setShowCreate(true)}
      />
      <SkJabatanFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff/sk-jabatan")({ component: StaffSkJabatanPage });

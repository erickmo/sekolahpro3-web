import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { BerkasGuruFormModal } from "../components/staff/BerkasGuruFormModal";
import { RenewBerkasButton } from "../features/pegawai/PegawaiActions";

type Row = {
  name: string;
  guru: string;
  jenis_berkas?: string;
  nomor_dokumen?: string;
  tanggal_berlaku?: string;
  tanggal_kadaluarsa?: string;
  status_expire?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Pegawai", sortable: true, cell: (r) => r.guru },
  { key: "jenis_berkas", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_berkas ?? "—"}</Badge> },
  { key: "nomor_dokumen", header: "Nomor", cell: (r) => <span className="font-mono text-xs">{r.nomor_dokumen ?? "—"}</span> },
  { key: "tanggal_kadaluarsa", header: "Kadaluarsa", sortable: true, cell: (r) => r.tanggal_kadaluarsa ?? "—" },
  { key: "status_expire", header: "Status",
    cell: (r) => <Badge tone={r.status_expire === "Aktif" ? "success" : r.status_expire === "Expired" ? "warning" : "neutral"} dot>{r.status_expire ?? "—"}</Badge> },
  { key: "renew", header: "Aksi", cell: (r) => <RenewBerkasButton berkas={r.name} /> },
];

function StaffBerkasPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Staff"
        title="Berkas Staff"
        doctype="Berkas Guru"
        fields={["name", "guru", "jenis_berkas", "nomor_dokumen", "tanggal_kadaluarsa", "status_expire"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Unggah Berkas"
        onAdd={() => setShowCreate(true)}
      />
      <BerkasGuruFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff/berkas")({ component: StaffBerkasPage });

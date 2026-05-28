import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { RuanganFormModal } from "../components/infrastruktur/RuanganFormModal";

type Row = { name: string; nama: string; nama_ruangan?: string; jenis?: string; jenis_ruangan?: string; lantai?: string; kapasitas?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama", sortable: true, cell: (r) => r.nama },
  { key: "jenis_ruangan", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_ruangan ?? "—"}</Badge> },
  { key: "lantai", header: "Lantai", cell: (r) => r.lantai ?? "—" },
  { key: "kapasitas", header: "Kapasitas", align: "right", cell: (r) => r.kapasitas ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Tersedia" ? "success" : r.status === "Dipakai" ? "brand" : r.status === "Maintenance" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function RuanganPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Infrastruktur"
        title="Ruangan"
        doctype="Ruangan"
        fields={["name", "nama", "jenis_ruangan", "lantai", "kapasitas", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
        selectFilters={[
          { key: "jenis", label: "Jenis", field: "jenis_ruangan",
            options: ["Semua", "Kelas", "Lab", "Perpustakaan", "Aula", "Kamar Asrama", "Musholla", "Kantor", "Gudang", "Lainnya"].map((v) => ({ value: v, label: v })) },
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Tersedia", "Dipakai", "Maintenance"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Tambah Ruangan"
        onAdd={() => setShowCreate(true)}
      />
      <RuanganFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/ruangan")({ component: RuanganPage });

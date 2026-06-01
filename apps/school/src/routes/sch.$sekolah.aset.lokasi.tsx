import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { LokasiFormModal } from "../components/aset/LokasiFormModal";

type Row = {
  name: string;
  nama_lokasi: string;
  kode?: string;
  jenis_lokasi?: string;
  penanggung_jawab?: string;
  status?: string;
};

const FIELDS = ["name", "nama_lokasi", "kode", "jenis_lokasi", "penanggung_jawab", "status"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_lokasi", header: "Nama Lokasi", sortable: true, cell: (r) => r.nama_lokasi },
  { key: "jenis_lokasi", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_lokasi ?? "—"}</Badge> },
  { key: "penanggung_jawab", header: "Penanggung Jawab", cell: (r) => r.penanggung_jawab ?? "—" },
  { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function LokasiPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Lokasi Aset"
        description="Master gudang & ruang penyimpanan aset."
        doctype="Lokasi Aset"
        fields={FIELDS}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_lokasi", dir: "asc" }}
        searchFields={["name", "nama_lokasi"]}
        selectFilters={[
          {
            key: "jenis",
            label: "Jenis",
            field: "jenis_lokasi",
            options: ["Semua", "Gudang", "Ruang Penyimpanan", "Lapangan", "Lab", "Kelas", "Lainnya"].map((v) => ({ value: v, label: v })),
          },
          {
            key: "status",
            label: "Status",
            field: "status",
            options: ["Semua", "Aktif", "Nonaktif"].map((v) => ({ value: v, label: v })),
          },
        ]}
        onAdd={() => setShowCreate(true)}
        addLabel="Tambah Lokasi"
      />
      <LokasiFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/lokasi")({ component: LokasiPage });

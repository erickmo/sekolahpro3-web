import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AsetFormModal } from "../components/aset/AsetFormModal";
import { asetStatusTone, kondisiTone, stokLabel } from "../lib/aset/badges";

type Row = {
  name: string;
  nama: string;
  kategori?: string;
  lokasi?: string;
  jumlah_total?: number;
  jumlah_tersedia?: number;
  kondisi?: string;
  status?: string;
};

const FIELDS = ["name", "nama", "kategori", "lokasi", "jumlah_total", "jumlah_tersedia", "kondisi", "status"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama", sortable: true, cell: (r) => r.nama },
  { key: "kategori", header: "Kategori", cell: (r) => <Badge tone="neutral">{r.kategori ?? "—"}</Badge> },
  { key: "lokasi", header: "Lokasi", cell: (r) => r.lokasi ?? "—" },
  { key: "jumlah_tersedia", header: "Stok", align: "right", cell: (r) => stokLabel(r.jumlah_tersedia, r.jumlah_total) },
  { key: "kondisi", header: "Kondisi", cell: (r) => <Badge tone={kondisiTone(r.kondisi)} dot>{r.kondisi ?? "—"}</Badge> },
  { key: "status", header: "Status", cell: (r) => <Badge tone={asetStatusTone(r.status)} dot>{r.status ?? "—"}</Badge> },
];

function DaftarAsetPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Daftar Aset"
        description="Registry seluruh aset inventaris sekolah."
        doctype="Aset"
        fields={FIELDS}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
        selectFilters={[
          {
            key: "kondisi",
            label: "Kondisi",
            field: "kondisi",
            options: ["Semua", "Baik", "Rusak Ringan", "Rusak Berat"].map((v) => ({ value: v, label: v })),
          },
          {
            key: "status",
            label: "Status",
            field: "status",
            options: ["Semua", "Tersedia", "Maintenance", "Hilang", "Dihapus"].map((v) => ({ value: v, label: v })),
          },
        ]}
        onAdd={() => setShowCreate(true)}
        addLabel="Tambah Aset"
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/aset/daftar/$name", params: { sekolah, name: r.name } })}
        exportConfig={{
          fileName: "aset.csv",
          fields: FIELDS,
          mapRow: (r) => ({
            id: r.name,
            nama: r.nama,
            kategori: r.kategori ?? "",
            lokasi: r.lokasi ?? "",
            jumlah_total: r.jumlah_total ?? 0,
            jumlah_tersedia: r.jumlah_tersedia ?? 0,
            kondisi: r.kondisi ?? "",
            status: r.status ?? "",
          }),
        }}
      />
      <AsetFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/daftar/")({ component: DaftarAsetPage });

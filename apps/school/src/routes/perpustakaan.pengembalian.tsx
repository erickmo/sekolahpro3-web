import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  peminjaman: string;
  tanggal_kembali: string;
  kondisi_kembali: string;
  denda_total?: number;
  petugas?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Pengembalian", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "peminjaman", header: "Ref Peminjaman", cell: (r) => <span className="font-mono text-xs">{r.peminjaman}</span> },
  { key: "tanggal_kembali", header: "Tgl Kembali", sortable: true, cell: (r) => r.tanggal_kembali },
  { key: "kondisi_kembali", header: "Kondisi",
    cell: (r) => <Badge tone={r.kondisi_kembali === "Baik" ? "success" : r.kondisi_kembali === "Rusak Ringan" ? "warning" : "danger"}>{r.kondisi_kembali}</Badge> },
  { key: "denda_total", header: "Denda", align: "right", cell: (r) => r.denda_total ? `Rp ${r.denda_total.toLocaleString("id-ID")}` : "—" },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "peminjaman", label: "No. Peminjaman", type: "text", required: true, hint: "Referensi peminjaman aktif" },
  { name: "tanggal_kembali", label: "Tgl Kembali", type: "date", required: true, defaultValue: perpToday() },
  {
    name: "kondisi_kembali", label: "Kondisi", type: "select", required: true,
    options: ["Baik", "Rusak Ringan", "Rusak Berat", "Hilang"].map((v) => ({ value: v, label: v })),
  },
  { name: "denda_total", label: "Denda (Rp)", type: "number" },
  { name: "petugas", label: "Petugas", type: "text" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

function PengembalianPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Pengembalian Buku"
        doctype="Pengembalian Buku"
        fields={["name", "peminjaman", "tanggal_kembali", "kondisi_kembali", "denda_total", "petugas"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_kembali", dir: "desc" }}
        searchFields={["name", "peminjaman"]}
        addLabel="Catat Pengembalian"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/pengembalian/$name", params: { name: r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Pengembalian Buku"
        title="Catat Pengembalian Buku"
        fields={CREATE_FIELDS}
        submitLabel="Simpan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/perpustakaan/pengembalian/$name", params: { name } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/pengembalian")({ component: PengembalianPage });

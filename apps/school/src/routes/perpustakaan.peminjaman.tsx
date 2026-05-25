import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  anggota: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  status: string;
  petugas?: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Peminjaman", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
  { key: "tanggal_pinjam", header: "Tgl Pinjam", sortable: true, cell: (r) => r.tanggal_pinjam },
  { key: "tanggal_rencana_kembali", header: "Rencana Kembali", sortable: true, cell: (r) => r.tanggal_rencana_kembali },
  {
    key: "status", header: "Status", sortable: true,
    cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge>,
  },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "anggota", label: "Anggota (ID)", type: "text", required: true, hint: "ID Anggota Perpustakaan" },
  { name: "buku", label: "Buku (ISBN/Kode)", type: "text", required: true },
  { name: "kopi", label: "Kopi (Kode Kopi)", type: "text" },
  { name: "tanggal_pinjam", label: "Tgl Pinjam", type: "date", required: true, defaultValue: perpToday() },
  { name: "tanggal_rencana_kembali", label: "Rencana Kembali", type: "date", required: true },
  { name: "petugas", label: "Petugas", type: "text" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

function PeminjamanPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Peminjaman Buku"
        description="Daftar transaksi peminjaman aktif & riwayat."
        doctype="Peminjaman Buku"
        fields={["name", "anggota", "tanggal_pinjam", "tanggal_rencana_kembali", "status", "petugas"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_pinjam", dir: "desc" }}
        searchFields={["name", "anggota"]}
        selectFilters={[
          {
            key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Selesai", "Terlambat", "Hilang", "Batal"].map((v) => ({ value: v, label: v })),
          },
        ]}
        addLabel="Pinjam Baru"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/peminjaman/$name", params: { name: r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Peminjaman Buku"
        title="Pinjam Buku Baru"
        description="Catat transaksi peminjaman baru."
        fields={CREATE_FIELDS}
        submitLabel="Pinjamkan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/perpustakaan/peminjaman/$name", params: { name } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/peminjaman")({ component: PeminjamanPage });

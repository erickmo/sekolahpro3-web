import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  buku: string;
  anggota: string;
  posisi_antrian: number;
  status: string;
  tanggal_reservasi: string;
  berlaku_sampai?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Reservasi", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "buku", header: "Buku", sortable: true, cell: (r) => r.buku },
  { key: "anggota", header: "Anggota", cell: (r) => r.anggota },
  { key: "posisi_antrian", header: "Antrian", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">#{r.posisi_antrian}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "brand" : r.status === "Dipenuhi" ? "success" : r.status === "Kedaluwarsa" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_reservasi", header: "Tgl Reservasi", sortable: true, cell: (r) => r.tanggal_reservasi },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "buku", label: "Buku (ISBN/Kode)", type: "text", required: true },
  { name: "anggota", label: "Anggota (ID)", type: "text", required: true },
  { name: "tanggal_reservasi", label: "Tgl Reservasi", type: "date", required: true, defaultValue: perpToday() },
  { name: "berlaku_sampai", label: "Berlaku Sampai", type: "date" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

function ReservasiPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Reservasi Buku"
        description="Antrian reservasi FIFO per judul buku."
        doctype="Reservasi Buku"
        fields={["name", "buku", "anggota", "posisi_antrian", "status", "tanggal_reservasi", "berlaku_sampai"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_reservasi", dir: "desc" }}
        searchFields={["name", "buku", "anggota"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Dipenuhi", "Kedaluwarsa", "Batal"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Reservasi Baru"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/reservasi/$name", params: { name: r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Reservasi Buku"
        title="Reservasi Buku Baru"
        fields={CREATE_FIELDS}
        submitLabel="Simpan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/perpustakaan/reservasi/$name", params: { name } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/reservasi")({ component: ReservasiPage });

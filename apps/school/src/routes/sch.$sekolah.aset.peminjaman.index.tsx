import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PeminjamanFormModal } from "../components/aset/PeminjamanFormModal";
import { peminjamanStatusTone } from "../lib/aset/badges";

type Row = {
  name: string;
  pemohon: string;
  peran_pemohon?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  status?: string;
};

const FIELDS = ["name", "pemohon", "peran_pemohon", "tanggal_pinjam", "tanggal_kembali_rencana", "status"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "pemohon", header: "Pemohon", sortable: true, cell: (r) => r.pemohon },
  { key: "peran_pemohon", header: "Peran", cell: (r) => <Badge tone="neutral">{r.peran_pemohon ?? "—"}</Badge> },
  { key: "tanggal_pinjam", header: "Pinjam", cell: (r) => r.tanggal_pinjam ?? "—" },
  { key: "tanggal_kembali_rencana", header: "Kembali", cell: (r) => r.tanggal_kembali_rencana ?? "—" },
  { key: "status", header: "Status", cell: (r) => <Badge tone={peminjamanStatusTone(r.status)} dot>{r.status ?? "—"}</Badge> },
];

function PeminjamanListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Peminjaman Aset"
        description="Permintaan pinjam aset, persetujuan, dan pengembalian."
        doctype="Permintaan Peminjaman Aset"
        fields={FIELDS}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "modified", dir: "desc" }}
        searchFields={["name", "pemohon"]}
        selectFilters={[
          {
            key: "status",
            label: "Status",
            field: "status",
            options: ["Semua", "Diajukan", "Dipinjam", "Terlambat", "Dikembalikan", "Ditolak"].map((v) => ({ value: v, label: v })),
          },
        ]}
        onAdd={() => setShowCreate(true)}
        addLabel="Buat Permintaan"
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/aset/peminjaman/$name", params: { sekolah, name: r.name } })}
      />
      <PeminjamanFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/peminjaman/")({ component: PeminjamanListPage });

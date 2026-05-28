import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  nama_lengkap: string;
  tipe_anggota: string;
  nis_nip?: string;
  kelas?: string;
  status: string;
  saldo_denda?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Anggota", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_lengkap", header: "Nama", sortable: true, cell: (r) => r.nama_lengkap },
  { key: "tipe_anggota", header: "Tipe", cell: (r) => <Badge tone="neutral">{r.tipe_anggota}</Badge> },
  { key: "nis_nip", header: "NIS/NIP", cell: (r) => r.nis_nip ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Dibekukan" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  { key: "saldo_denda", header: "Denda", align: "right",
    cell: (r) => r.saldo_denda ? <span className="text-rose-500 tabular-nums">Rp {r.saldo_denda.toLocaleString("id-ID")}</span> : "—" },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "nama_lengkap", label: "Nama Lengkap", type: "text", required: true },
  {
    name: "tipe_anggota", label: "Tipe", type: "select", required: true,
    options: ["Siswa", "Guru", "Staff"].map((v) => ({ value: v, label: v })),
  },
  { name: "nis_nip", label: "NIS / NIP", type: "text" },
  { name: "kelas", label: "Kelas", type: "text" },
  { name: "email", label: "Email", type: "text" },
  { name: "no_hp", label: "No HP", type: "text" },
  { name: "tanggal_daftar", label: "Tgl Daftar", type: "date", required: true, defaultValue: perpToday() },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

function AnggotaPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Anggota Perpustakaan"
        doctype="Anggota Perpustakaan"
        fields={["name", "nama_lengkap", "tipe_anggota", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_lengkap", dir: "asc" }}
        searchFields={["name", "nama_lengkap"]}
        selectFilters={[
          { key: "tipe", label: "Tipe", field: "tipe_anggota",
            options: ["Semua", "Siswa", "Guru", "Staff"].map((v) => ({ value: v, label: v })) },
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Dibekukan", "Lulus", "Keluar"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Daftar Anggota"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/$sekolah/perpustakaan/anggota/$name", params: { sekolah, name: r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Anggota Perpustakaan"
        title="Daftarkan Anggota Baru"
        fields={CREATE_FIELDS}
        submitLabel="Daftarkan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/$sekolah/perpustakaan/anggota/$name", params: { sekolah, name } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/anggota")({ component: AnggotaPage });

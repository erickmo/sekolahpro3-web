import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Avatar, Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { StaffFormModal } from "../components/staff/StaffFormModal";

type Row = {
  name: string;
  nama_lengkap: string;
  nip?: string;
  nuptk?: string;
  jenis_kelamin?: string;
  status_kepegawaian?: string;
  jabatan_fungsional?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
};

const STATUS_KEP_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "PNS", label: "PNS" },
  { value: "PPPK", label: "PPPK" },
  { value: "GTY", label: "GTY" },
  { value: "GTT", label: "GTT" },
  { value: "Honorer", label: "Honorer" },
];

const JK_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "Laki-laki", label: "L" },
  { value: "Perempuan", label: "P" },
];

const AKTIF_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "1", label: "Aktif" },
  { value: "0", label: "Non-aktif" },
];

const COLUMNS: Column<Row>[] = [
  {
    key: "nama_lengkap",
    header: "Staff",
    sortable: true,
    cell: (r) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={r.nama_lengkap} size="sm" />
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{r.nama_lengkap}</div>
          <div className="text-xs text-muted-fg tabular-nums">
            {r.nip ? `NIP ${r.nip}` : r.name}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "jabatan_fungsional",
    header: "Jabatan",
    cell: (r) => <span className="text-sm">{r.jabatan_fungsional ?? "—"}</span>,
  },
  {
    key: "sekolah",
    header: "Sekolah",
    sortable: true,
    cell: (r) => <span className="text-sm">{r.sekolah ?? "—"}</span>,
  },
  {
    key: "jenis_kelamin",
    header: "JK",
    align: "center",
    width: "60px",
    cell: (r) => (
      <span className="text-xs">
        {r.jenis_kelamin === "Laki-laki" ? "L" : r.jenis_kelamin === "Perempuan" ? "P" : "—"}
      </span>
    ),
  },
  {
    key: "status_kepegawaian",
    header: "Status Kepegawaian",
    sortable: true,
    cell: (r) => <Badge tone="neutral">{r.status_kepegawaian ?? "—"}</Badge>,
  },
  {
    key: "is_aktif",
    header: "Status",
    sortable: true,
    cell: (r) => (
      <Badge tone={r.is_aktif ? "success" : "neutral"} dot>
        {r.is_aktif ? "Aktif" : "Non-aktif"}
      </Badge>
    ),
  },
];

function StaffListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Direktori"
        title="Staff"
        description="Kelola data tenaga kependidikan dan staf sekolah."
        doctype="Guru"
        fields={[
          "name",
          "nama_lengkap",
          "nip",
          "nuptk",
          "jenis_kelamin",
          "status_kepegawaian",
          "jabatan_fungsional",
          "sekolah",
          "is_aktif",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_lengkap", dir: "asc" }}
        searchFields={["name", "nama_lengkap", "nip", "nuptk"]}
        selectFilters={[
          { key: "status_kepegawaian", field: "status_kepegawaian", label: "Status Kepegawaian", options: STATUS_KEP_OPTIONS },
          { key: "jenis_kelamin", field: "jenis_kelamin", label: "JK", options: JK_OPTIONS },
          { key: "is_aktif", field: "is_aktif", label: "Aktif", options: AKTIF_OPTIONS },
        ]}
        addLabel="Tambah Staff"
        onAdd={() => setShowCreate(true)}
        onRowClick={(r) => navigate({ to: "/staff/$nip", params: { nip: r.name } })}
      />
      <StaffFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/staff/daftar")({ component: StaffListPage });

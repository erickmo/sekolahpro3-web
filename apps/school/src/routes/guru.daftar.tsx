import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  type Column,
} from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { GURU_DOCTYPE, GURU_FIELDS } from "../components/guru-extra/guru-fields";

type Row = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  nuptk?: string;
  jabatan_fungsional?: string;
  status_kepegawaian?: string;
  is_aktif?: 0 | 1;
};

const COLUMNS: Column<Row>[] = [
  {
    key: "nama_lengkap",
    header: "Guru",
    sortable: true,
    cell: (g) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={g.nama_lengkap ?? g.name} size="sm" />
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{g.nama_lengkap ?? g.name}</div>
          <div className="text-xs text-muted-fg tabular-nums">
            NIP {g.nip ?? "—"} · NUPTK {g.nuptk ?? "—"}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "jabatan_fungsional",
    header: "Jabatan Fungsional",
    sortable: true,
    cell: (g) => <div className="text-fg">{g.jabatan_fungsional ?? "—"}</div>,
  },
  {
    key: "status_kepegawaian",
    header: "Kepegawaian",
    cell: (g) => <Badge tone="brand">{g.status_kepegawaian ?? "—"}</Badge>,
  },
  {
    key: "is_aktif",
    header: "Status",
    sortable: true,
    cell: (g) => (
      <Badge tone={g.is_aktif === 1 ? "success" : "neutral"} dot>
        {g.is_aktif === 1 ? "Aktif" : "Non-aktif"}
      </Badge>
    ),
  },
];

function GuruListPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Direktori"
        title="Guru"
        description="Kelola data guru, jadwal mengajar, dan kepegawaian."
        doctype="Guru"
        fields={["name", "nama_lengkap", "nip", "nuptk", "jabatan_fungsional", "status_kepegawaian", "is_aktif"]}
        rowKey={(g) => g.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_lengkap", dir: "asc" }}
        searchFields={["name", "nama_lengkap", "nip", "nuptk"]}
        addLabel="Tambah Guru"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(g) => navigate({ to: "/guru/$nip", params: { nip: g.name } })}
      />
      <ResourceCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype={GURU_DOCTYPE}
        title="Tambah Guru"
        description="Daftarkan guru baru dan kaitkan dengan akun pengguna."
        fields={GURU_FIELDS}
        onCreated={(doc) => {
          const nm = (doc as { name?: string }).name;
          if (nm) navigate({ to: "/guru/$nip", params: { nip: nm } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/guru/daftar")({ component: GuruListPage });

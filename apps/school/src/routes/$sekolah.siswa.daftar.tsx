import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  type Column,
} from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  nama_lengkap?: string;
  nis?: string;
  nisn?: string;
  jenjang?: string;
  sekolah?: string;
  tahun_masuk?: string;
  jenis_kelamin?: string;
  agama?: string;
  status?: string;
};

const TONE_BY_STATUS: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "success",
  Calon: "brand",
  Alumni: "neutral",
  "Pindah Keluar": "warning",
  DO: "danger",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "nama_lengkap",
    header: "Siswa",
    sortable: true,
    cell: (s) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={s.nama_lengkap ?? s.name} size="sm" />
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{s.nama_lengkap ?? s.name}</div>
          <div className="text-xs text-muted-fg tabular-nums">
            NIS {s.nis ?? s.name} · NISN {s.nisn ?? "—"}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "jenjang",
    header: "Jenjang / Sekolah",
    sortable: true,
    cell: (s) => (
      <div>
        <div className="text-fg">{s.jenjang ?? "—"}</div>
        <div className="text-xs text-muted-fg">{s.sekolah ?? "—"}</div>
      </div>
    ),
  },
  {
    key: "jenis_kelamin",
    header: "JK",
    cell: (s) => <span className="text-xs">{s.jenis_kelamin === "Laki-laki" ? "L" : s.jenis_kelamin === "Perempuan" ? "P" : "—"}</span>,
    width: "60px",
    align: "center",
  },
  { key: "agama", header: "Agama", cell: (s) => <span className="text-sm">{s.agama ?? "—"}</span> },
  { key: "tahun_masuk", header: "Masuk", sortable: true, cell: (s) => <span className="text-sm tabular-nums">{s.tahun_masuk ?? "—"}</span> },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (s) => (
      <Badge tone={TONE_BY_STATUS[s.status ?? ""] ?? "neutral"} dot>
        {s.status ?? "—"}
      </Badge>
    ),
  },
];

function SiswaListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Direktori"
      title="Siswa"
      description="Kelola data siswa, profil, dan kelas."
      doctype="Siswa"
      fields={["name", "nama_lengkap", "nis", "nisn", "jenjang", "sekolah", "tahun_masuk", "jenis_kelamin", "agama", "status"]}
      rowKey={(s) => s.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_lengkap", dir: "asc" }}
      searchFields={["name", "nama_lengkap", "nis", "nisn"]}
      addLabel="Tambah Siswa"
      onAdd={() => navigate({ to: "/$sekolah/siswa/new", params: { sekolah } })}
      onRowClick={(s) => navigate({ to: "/$sekolah/siswa/$nis", params: { sekolah, nis: s.name } })}
    />
  );
}

export const Route = createFileRoute("/$sekolah/siswa/daftar")({ component: SiswaListPage });

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  type Column,
} from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// TODO confirm field names in backend doctype "Guru":
// guessing snake_case: nama_lengkap, nip, nuptk, jabatan, jenis_ptk, status_kepegawaian, jenis_kelamin
type Row = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  nuptk?: string;
  jabatan?: string;
  jenis_ptk?: string;
  status_kepegawaian?: string;
  jenis_kelamin?: string;
  status?: string;
};

const TONE_BY_STATUS: Record<string, "success" | "warning" | "neutral"> = {
  Aktif: "success",
  Cuti: "warning",
  "Non-aktif": "neutral",
  Pensiun: "neutral",
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
    key: "jabatan",
    header: "Jabatan / Jenis PTK",
    sortable: true,
    cell: (g) => (
      <div>
        <div className="text-fg">{g.jabatan ?? "—"}</div>
        <div className="text-xs text-muted-fg">{g.jenis_ptk ?? "—"}</div>
      </div>
    ),
  },
  {
    key: "jenis_kelamin",
    header: "JK",
    cell: (g) => <span className="text-xs">{g.jenis_kelamin === "Laki-laki" ? "L" : g.jenis_kelamin === "Perempuan" ? "P" : "—"}</span>,
    width: "60px",
    align: "center",
  },
  {
    key: "status_kepegawaian",
    header: "Kepegawaian",
    cell: (g) => <Badge tone="brand">{g.status_kepegawaian ?? "—"}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (g) => (
      <Badge tone={TONE_BY_STATUS[g.status ?? ""] ?? "neutral"} dot>
        {g.status ?? "—"}
      </Badge>
    ),
  },
];

function GuruListPage() {
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Direktori"
      title="Guru"
      description="Kelola data guru, jadwal mengajar, dan kepegawaian."
      doctype="Guru"
      fields={["name", "nama_lengkap", "nip", "nuptk", "jabatan", "jenis_ptk", "status_kepegawaian", "jenis_kelamin", "status"]}
      rowKey={(g) => g.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_lengkap", dir: "asc" }}
      searchFields={["name", "nama_lengkap", "nip", "nuptk"]}
      addLabel="Tambah Guru"
      onAdd={() => alert("Form guru (P2)")}
      onRowClick={(g) => navigate({ to: "/guru/$nip", params: { nip: g.name } })}
    />
  );
}

export const Route = createFileRoute("/guru/daftar")({ component: GuruListPage });

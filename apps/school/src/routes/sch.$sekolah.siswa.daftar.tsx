import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  Avatar,
  Badge,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { SiswaImportDialog } from "../components/SiswaImportDialog";

type Row = {
  name: string;
  nama_lengkap?: string;
  nis?: string;
  nisn?: string;
  jenjang?: string;
  tahun_masuk?: string;
  tanggal_lahir?: string;
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

const STATUS = ["Calon", "Aktif", "Alumni", "Pindah Keluar", "DO"];
const JENIS_KELAMIN = ["Laki-laki", "Perempuan"];
const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Budha", "Konghucu"];

type Opt = { value: string; label: string };
const withSemua = (vals: string[]): Opt[] => [
  { value: "Semua", label: "Semua" },
  ...vals.map((v) => ({ value: v, label: v })),
];

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
    header: "Jenjang",
    sortable: true,
    cell: (s) => <span className="text-fg">{s.jenjang ?? "—"}</span>,
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
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();

  // Default to active students; "Semua" clears the filter.
  const [status, setStatus] = useState("Aktif");

  // Dynamic Link-field options scoped to the active school.
  const jenjangQ = useResourceList<{ name: string }>("Unit Jenjang", {
    fields: ["name"],
    order_by: "`name` asc",
    limit_page_length: 0,
  });
  const tahunQ = useResourceList<{ name: string }>("Tahun Ajaran", {
    fields: ["name"],
    order_by: "`name` desc",
    limit_page_length: 0,
  });

  const jenjangOpts = withSemua((jenjangQ.data ?? []).map((r) => r.name));
  const tahunOpts = withSemua((tahunQ.data ?? []).map((r) => r.name));

  return (
    <ResourceListPage<Row>
      eyebrow="Direktori"
      title="Siswa"
      description="Kelola data siswa, profil, dan kelas."
      doctype="Siswa"
      fields={["name", "nama_lengkap", "nis", "nisn", "jenjang", "tahun_masuk", "jenis_kelamin", "agama", "status"]}
      rowKey={(s) => s.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_lengkap", dir: "asc" }}
      searchFields={["name", "nama_lengkap", "nis", "nisn"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status", value: status, onChange: setStatus, options: withSemua(STATUS) },
        { key: "jenjang", label: "Jenjang", field: "jenjang", options: jenjangOpts },
        { key: "jenis_kelamin", label: "JK", field: "jenis_kelamin", options: withSemua(JENIS_KELAMIN) },
        { key: "tahun_masuk", label: "Tahun Masuk", field: "tahun_masuk", options: tahunOpts },
        { key: "agama", label: "Agama", field: "agama", options: withSemua(AGAMA) },
      ]}
      exportConfig={{
        fileName: "siswa.csv",
        fields: ["nama_lengkap", "nis", "nisn", "jenis_kelamin", "tanggal_lahir", "agama", "jenjang", "tahun_masuk", "status"],
        mapRow: (s) => ({
          nama_lengkap: s.nama_lengkap ?? "",
          nis: s.nis ?? "",
          nisn: s.nisn ?? "",
          jenis_kelamin: s.jenis_kelamin ?? "",
          tanggal_lahir: s.tanggal_lahir ?? "",
          agama: s.agama ?? "",
          jenjang: s.jenjang ?? "",
          tahun_masuk: s.tahun_masuk ?? "",
          status: s.status ?? "",
        }),
      }}
      extraActions={<SiswaImportDialog />}
      addLabel="Tambah Siswa"
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/new", params: { sekolah } })}
      onRowClick={(s) => navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis: s.name } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/daftar")({ component: SiswaListPage });

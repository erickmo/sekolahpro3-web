import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SiswaGettingStarted } from "../components/siswa/SiswaGettingStarted";
import { summarizePendaftaran, SISWA_STATUS_FIELDS } from "../lib/orang/siswaListSummaries";

// Onboarding steps shown when no registration exists yet.
const ONBOARDING_STEPS = [
  "Klik Daftar Siswa Baru lalu pilih jenis pendaftaran",
  "Isi data calon dan rombel target",
  "Submit untuk diverifikasi panitia, lalu Diterima/Ditolak",
];

type Row = {
  name: string;
  nama_lengkap: string;
  nisn?: string;
  jenis_pendaftaran: "Reguler" | "Mutasi" | "Beasiswa" | "Khusus";
  tanggal_daftar: string;
  rombel_target?: string;
  status: "Draft" | "Submitted" | "Diterima" | "Ditolak";
};

const STATUS_TONE: Record<Row["status"], "neutral" | "warning" | "success" | "danger"> = {
  Draft: "neutral",
  Submitted: "warning",
  Diterima: "success",
  Ditolak: "danger",
};

const JENIS_TONE: Record<Row["jenis_pendaftaran"], "neutral" | "brand"> = {
  Reguler: "neutral",
  Mutasi: "brand",
  Beasiswa: "brand",
  Khusus: "brand",
};

function makeColumns(sekolah: string): Column<Row>[] {
  return [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link
        to="/sch/$sekolah/siswa/pendaftaran/$id"
        params={{ sekolah, id: r.name }}
        className="font-mono text-xs text-brand hover:underline"
      >
        {r.name}
      </Link>
    ),
  },
  { key: "nama_lengkap", header: "Nama", sortable: true, cell: (r) => r.nama_lengkap },
  { key: "nisn", header: "NISN", cell: (r) => <span className="font-mono text-xs">{r.nisn ?? "—"}</span> },
  {
    key: "jenis_pendaftaran",
    header: "Jenis",
    cell: (r) => <Badge tone={JENIS_TONE[r.jenis_pendaftaran]}>{r.jenis_pendaftaran}</Badge>,
  },
  { key: "tanggal_daftar", header: "Tgl Daftar", sortable: true, cell: (r) => r.tanggal_daftar },
  { key: "rombel_target", header: "Rombel Target", cell: (r) => r.rombel_target ?? "—" },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status]} dot>
        {r.status}
      </Badge>
    ),
  },
  ];
}

function PendaftaranPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const columns = useMemo(() => makeColumns(sekolah), [sekolah]);

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Pendaftaran Siswa"
      doctype="Pendaftaran Siswa"
      fields={[
        "name",
        "nama_lengkap",
        "nisn",
        "jenis_pendaftaran",
        "tanggal_daftar",
        "rombel_target",
        "status",
      ]}
      rowKey={(r) => r.name}
      columns={columns}
      summarize={summarizePendaftaran}
      summaryFields={SISWA_STATUS_FIELDS}
      gettingStarted={
        <SiswaGettingStarted
          sekolah={sekolah}
          title="Belum ada pendaftaran"
          description="Mulai proses penerimaan siswa baru untuk tahun ajaran ini."
          steps={ONBOARDING_STEPS}
          primaryAction={{ label: "Daftar Siswa Baru", href: "/sch/$sekolah/siswa/pendaftaran/new" }}
        />
      }
      defaultSort={{ key: "tanggal_daftar", dir: "desc" }}
      searchFields={["name", "nama_lengkap", "nisn"]}
      selectFilters={[
        {
          key: "jenis",
          label: "Jenis",
          field: "jenis_pendaftaran",
          options: ["Semua", "Reguler", "Mutasi", "Beasiswa", "Khusus"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        {
          key: "status",
          label: "Status",
          field: "status",
          options: ["Semua", "Draft", "Submitted", "Diterima", "Ditolak"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Daftar Siswa Baru"
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/pendaftaran/new", params: { sekolah } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran")({ component: PendaftaranPage });

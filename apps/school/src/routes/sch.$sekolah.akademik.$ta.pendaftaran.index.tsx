import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

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

function makeColumns(sekolah: string, ta: string): Column<Row>[] {
  return [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link
        to="/sch/$sekolah/akademik/$ta/pendaftaran/$id"
        params={{ sekolah, ta, id: r.name }}
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
  const { sekolah, ta } = useParams({ from: "/sch/$sekolah/akademik/$ta/pendaftaran/" });
  const columns = useMemo(() => makeColumns(sekolah, ta), [sekolah, ta]);

  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="siswa-guide:"
        storageId="pendaftaran"
        title={SISWA_PAGE_GUIDES.pendaftaran.title}
        intro={SISWA_PAGE_GUIDES.pendaftaran.intro}
        steps={SISWA_PAGE_GUIDES.pendaftaran.steps}
        tips={SISWA_PAGE_GUIDES.pendaftaran.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
      eyebrow="Akademik"
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
      onAdd={() => navigate({ to: "/sch/$sekolah/akademik/$ta/pendaftaran/new", params: { sekolah, ta } })}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/pendaftaran/")({ component: PendaftaranPage });

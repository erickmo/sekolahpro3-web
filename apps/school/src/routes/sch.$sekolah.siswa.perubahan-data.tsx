import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SiswaGettingStarted } from "../components/siswa/SiswaGettingStarted";
import { summarizePerubahanData, SISWA_STATE_FIELDS } from "../lib/orang/siswaListSummaries";

// Onboarding steps shown when no data-change request exists yet.
const ONBOARDING_STEPS = [
  "Pilih siswa dan field yang ingin diperbaiki (nama, NIK, NISN, dll.)",
  "Klik Ajukan Perubahan dan isi nilai baru",
  "Pengajuan menunggu persetujuan Ka-TU lalu Kepsek",
];

type Row = {
  name: string;
  siswa: string;
  field_diubah: string;
  nilai_lama?: string;
  nilai_baru?: string;
  workflow_state?: string;
  modified?: string;
};

const STATE_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Approved: "success",
  Rejected: "danger",
  "Pending Ka-TU": "warning",
  "Pending Kepsek": "warning",
  Draft: "neutral",
};

function makeColumns(sekolah: string): Column<Row>[] {
  return [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link
        to="/sch/$sekolah/siswa/perubahan-data/$id"
        params={{ sekolah, id: r.name }}
        className="font-mono text-xs text-brand hover:underline"
      >
        {r.name}
      </Link>
    ),
  },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "field_diubah", header: "Field", cell: (r) => <code className="font-mono text-xs">{r.field_diubah}</code> },
  {
    key: "nilai_lama",
    header: "Sebelum → Sesudah",
    cell: (r) => (
      <span className="text-xs">
        <span className="text-muted-fg line-through">{r.nilai_lama ?? "—"}</span>
        {" → "}
        <span className="text-fg font-medium">{r.nilai_baru ?? "—"}</span>
      </span>
    ),
  },
  {
    key: "workflow_state",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATE_TONE[r.workflow_state ?? "Draft"] ?? "neutral"} dot>
        {r.workflow_state ?? "Draft"}
      </Badge>
    ),
  },
  ];
}

function PerubahanDataPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const columns = useMemo(() => makeColumns(sekolah), [sekolah]);

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Perubahan Data Siswa"
      doctype="Perubahan Data Siswa"
      fields={["name", "siswa", "field_diubah", "nilai_lama", "nilai_baru", "workflow_state", "modified"]}
      rowKey={(r) => r.name}
      columns={columns}
      summarize={summarizePerubahanData}
      summaryFields={SISWA_STATE_FIELDS}
      gettingStarted={
        <SiswaGettingStarted
          sekolah={sekolah}
          title="Belum ada pengajuan perubahan data"
          description="Ajukan koreksi data identitas siswa lewat alur persetujuan berjenjang."
          steps={ONBOARDING_STEPS}
          primaryAction={{ label: "Ajukan Perubahan", href: "/sch/$sekolah/siswa/perubahan-data/new" }}
        />
      }
      defaultSort={{ key: "modified", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        {
          key: "state",
          label: "Status",
          field: "workflow_state",
          options: ["Semua", "Draft", "Pending Ka-TU", "Pending Kepsek", "Approved", "Rejected"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        {
          key: "field",
          label: "Field",
          field: "field_diubah",
          options: ["Semua", "nama_lengkap", "nik", "tanggal_lahir", "nisn"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Ajukan Perubahan"
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/perubahan-data/new", params: { sekolah } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/perubahan-data")({ component: PerubahanDataPage });

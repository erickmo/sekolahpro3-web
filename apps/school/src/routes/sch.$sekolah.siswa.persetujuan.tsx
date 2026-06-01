import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SiswaGettingStarted } from "../components/siswa/SiswaGettingStarted";
import { summarizePersetujuan, SISWA_STATUS_FIELDS } from "../lib/orang/siswaListSummaries";

// Onboarding steps shown when no consent record exists yet.
const ONBOARDING_STEPS = [
  "Pilih siswa dan tujuan pemrosesan data (foto, Dapodik, mitra, medis)",
  "Klik Minta Persetujuan untuk merekam izin wali",
  "Status berubah otomatis bila izin dicabut atau kedaluwarsa",
];

type ConsentStatus = "Granted" | "Withdrawn" | "Expired" | "Pending";
type Purpose = "Publikasi Foto" | "Data Dapodik" | "Sharing Mitra" | "Medis Darurat";

type Row = {
  name: string;
  siswa: string;
  purpose: Purpose;
  status: ConsentStatus;
  granted_at?: string;
  withdrawn_at?: string;
  granted_method?: string;
};

const STATUS_TONE: Record<ConsentStatus, "success" | "danger" | "warning" | "neutral"> = {
  Granted: "success",
  Withdrawn: "danger",
  Expired: "warning",
  Pending: "neutral",
};

function makeColumns(sekolah: string): Column<Row>[] {
  return [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link
        to="/sch/$sekolah/siswa/persetujuan/$id"
        params={{ sekolah, id: r.name }}
        className="font-mono text-xs text-brand hover:underline"
      >
        {r.name}
      </Link>
    ),
  },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  {
    key: "purpose",
    header: "Tujuan",
    cell: (r) => <Badge tone="neutral">{r.purpose}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status]} dot>
        {r.status}
      </Badge>
    ),
  },
  {
    key: "granted_at",
    header: "Diberikan",
    cell: (r) => (r.granted_at ? <span className="text-xs">{r.granted_at}</span> : "—"),
  },
  {
    key: "granted_method",
    header: "Via",
    cell: (r) => r.granted_method ?? "—",
  },
  ];
}

function PersetujuanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const columns = useMemo(() => makeColumns(sekolah), [sekolah]);

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Persetujuan Wali (UU PDP)"
      doctype="Persetujuan Wali"
      fields={["name", "siswa", "purpose", "status", "granted_at", "withdrawn_at", "granted_method"]}
      rowKey={(r) => r.name}
      columns={columns}
      summarize={summarizePersetujuan}
      summaryFields={SISWA_STATUS_FIELDS}
      gettingStarted={
        <SiswaGettingStarted
          sekolah={sekolah}
          title="Belum ada persetujuan wali"
          description="Catat izin wali atas pemrosesan data siswa sesuai UU PDP."
          steps={ONBOARDING_STEPS}
          primaryAction={{ label: "Minta Persetujuan", href: "/sch/$sekolah/siswa/persetujuan/new" }}
        />
      }
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        {
          key: "purpose",
          label: "Tujuan",
          field: "purpose",
          options: ["Semua", "Publikasi Foto", "Data Dapodik", "Sharing Mitra", "Medis Darurat"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        {
          key: "status",
          label: "Status",
          field: "status",
          options: ["Semua", "Granted", "Pending", "Withdrawn", "Expired"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Minta Persetujuan"
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/persetujuan/new", params: { sekolah } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/persetujuan")({ component: PersetujuanPage });

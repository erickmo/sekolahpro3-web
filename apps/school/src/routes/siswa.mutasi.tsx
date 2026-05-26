import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  siswa: string;
  jenis_mutasi: string;
  tanggal_efektif: string;
  workflow_state: string;
};

const STATE_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Approved: "success",
  Rejected: "danger",
  "Pending Ka-TU": "warning",
  "Pending Kepsek": "warning",
  Draft: "neutral",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link to="/siswa/mutasi/$id" params={{ id: r.name }} className="font-mono text-xs text-brand hover:underline">
        {r.name}
      </Link>
    ),
  },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  {
    key: "jenis_mutasi",
    header: "Jenis",
    cell: (r) => (
      <Badge tone={r.jenis_mutasi === "DO" || r.jenis_mutasi === "Pindah Keluar" ? "danger" : "neutral"}>
        {r.jenis_mutasi}
      </Badge>
    ),
  },
  { key: "tanggal_efektif", header: "Tgl Efektif", sortable: true, cell: (r) => r.tanggal_efektif },
  {
    key: "workflow_state",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATE_TONE[r.workflow_state] ?? "neutral"} dot>
        {r.workflow_state}
      </Badge>
    ),
  },
];

function MutasiPage() {
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Mutasi Siswa"
      doctype="Mutasi Siswa"
      fields={["name", "siswa", "jenis_mutasi", "tanggal_efektif", "workflow_state"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        {
          key: "jenis",
          label: "Jenis",
          field: "jenis_mutasi",
          options: ["Semua", "Naik Kelas", "Tinggal Kelas", "Pindah Keluar", "DO"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        {
          key: "state",
          label: "Status",
          field: "workflow_state",
          options: ["Semua", "Draft", "Pending Ka-TU", "Pending Kepsek", "Approved", "Rejected"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Ajukan Mutasi"
      onAdd={() => navigate({ to: "/siswa/mutasi/new" })}
    />
  );
}

export const Route = createFileRoute("/siswa/mutasi")({ component: MutasiPage });

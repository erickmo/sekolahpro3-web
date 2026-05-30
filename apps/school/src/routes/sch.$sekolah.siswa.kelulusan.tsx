import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  siswa: string;
  tahun_ajaran?: string;
  status_kelulusan?: "Lulus" | "Tidak Lulus";
  tanggal_pengesahan?: string;
  workflow_state?: string;
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
      <Link to="/sch/$sekolah/siswa/kelulusan/$id" params={{ sekolah, id: r.name }} className="font-mono text-xs text-brand hover:underline">
        {r.name}
      </Link>
    ),
  },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "status_kelulusan",
    header: "Hasil",
    cell: (r) => (
      <Badge tone={r.status_kelulusan === "Lulus" ? "success" : r.status_kelulusan === "Tidak Lulus" ? "danger" : "neutral"}>
        {r.status_kelulusan ?? "—"}
      </Badge>
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
  { key: "tanggal_pengesahan", header: "Tgl Disahkan", sortable: true, cell: (r) => r.tanggal_pengesahan ?? "—" },
  ];
}

function KelulusanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const columns = useMemo(() => makeColumns(sekolah), [sekolah]);

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Kelulusan Siswa"
      doctype="Kelulusan Siswa"
      fields={["name", "siswa", "tahun_ajaran", "status_kelulusan", "tanggal_pengesahan", "workflow_state"]}
      rowKey={(r) => r.name}
      columns={columns}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        {
          key: "hasil",
          label: "Hasil",
          field: "status_kelulusan",
          options: ["Semua", "Lulus", "Tidak Lulus"].map((v) => ({ value: v, label: v })),
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
      addLabel="Proses Kelulusan"
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/kelulusan/new", params: { sekolah } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/kelulusan")({ component: KelulusanPage });

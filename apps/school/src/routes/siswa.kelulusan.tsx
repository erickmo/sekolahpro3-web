import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; siswa: string; tahun_kelulusan?: string; status_kelulusan?: string; nilai_akhir?: number; tanggal_sah?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "tahun_kelulusan", header: "Tahun", cell: (r) => r.tahun_kelulusan ?? "—" },
  { key: "nilai_akhir", header: "Nilai Akhir", align: "right",
    cell: (r) => r.nilai_akhir !== undefined ? <span className="tabular-nums">{r.nilai_akhir.toFixed(2)}</span> : "—" },
  { key: "status_kelulusan", header: "Status",
    cell: (r) => <Badge tone={r.status_kelulusan === "Lulus" ? "success" : r.status_kelulusan === "Tidak Lulus" ? "danger" : "neutral"} dot>{r.status_kelulusan ?? "—"}</Badge> },
  { key: "tanggal_sah", header: "Tgl Disahkan", sortable: true, cell: (r) => r.tanggal_sah ?? "—" },
];

function KelulusanPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Kelulusan Siswa"
      doctype="Kelulusan Siswa"
      fields={["name", "siswa", "status_kelulusan"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      addLabel="Proses Kelulusan"
      onAdd={() => alert("Form kelulusan (P2)")}
    />
  );
}

export const Route = createFileRoute("/siswa/kelulusan")({ component: KelulusanPage });

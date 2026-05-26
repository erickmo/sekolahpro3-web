import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; pendaftaran_ppdb?: string; calon_siswa?: string; nilai?: number; nilai_seleksi?: number; ranking?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "calon_siswa", header: "Calon Siswa", sortable: true, cell: (r) => r.calon_siswa ?? "—" },
  { key: "nilai", header: "Nilai", align: "right", sortable: true,
    cell: (r) => r.nilai !== undefined ? <span className="tabular-nums">{r.nilai.toFixed(2)}</span> : "—" },
  { key: "ranking", header: "Ranking", align: "right", sortable: true,
    cell: (r) => r.ranking !== undefined ? <span className="tabular-nums">#{r.ranking}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lulus" ? "success" : r.status === "Tidak Lulus" ? "danger" : r.status === "Cadangan" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function SeleksiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="PPDB"
      title="Seleksi PPDB"
      doctype="Seleksi PPDB"
      fields={["name", "pendaftaran_ppdb", "calon_siswa", "nilai"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nilai", dir: "desc" }}
      searchFields={["name", "calon_siswa"]}
      addLabel="Input Nilai"
      onAdd={() => alert("Form seleksi (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/seleksi")({ component: SeleksiPage });

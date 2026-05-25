import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_lengkap: string; nisn?: string; jenis_kelamin?: string; asal_sekolah?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_lengkap", header: "Nama Lengkap", sortable: true, cell: (r) => r.nama_lengkap },
  { key: "nisn", header: "NISN", cell: (r) => <span className="font-mono text-xs">{r.nisn ?? "—"}</span> },
  { key: "jenis_kelamin", header: "JK", cell: (r) => r.jenis_kelamin ?? "—" },
  { key: "asal_sekolah", header: "Asal Sekolah", cell: (r) => r.asal_sekolah ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lulus Seleksi" ? "success" : r.status === "Ditolak" ? "danger" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function CalonSiswaPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="PPDB"
      title="Calon Siswa"
      doctype="Calon Siswa"
      fields={["name", "nama_lengkap", "nisn", "jenis_kelamin", "asal_sekolah", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_lengkap", dir: "asc" }}
      searchFields={["name", "nama_lengkap", "nisn"]}
      addLabel="Tambah Calon"
      onAdd={() => alert("Form calon siswa (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/calon-siswa")({ component: CalonSiswaPage });

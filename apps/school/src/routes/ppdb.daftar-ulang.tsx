import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; calon_siswa?: string; tanggal_daftar_ulang?: string; status?: string; petugas?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "calon_siswa", header: "Calon Siswa", sortable: true, cell: (r) => r.calon_siswa ?? "—" },
  { key: "tanggal_daftar_ulang", header: "Tanggal", sortable: true, cell: (r) => r.tanggal_daftar_ulang ?? "—" },
  { key: "petugas", header: "Petugas", cell: (r) => r.petugas ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Selesai" ? "success" : r.status === "Batal" ? "danger" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function DaftarUlangPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="PPDB"
      title="Daftar Ulang"
      doctype="Daftar Ulang PPDB"
      fields={["name", "calon_siswa", "tanggal_daftar_ulang", "status", "petugas"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_daftar_ulang", dir: "desc" }}
      searchFields={["name", "calon_siswa"]}
      addLabel="Proses Daftar Ulang"
      onAdd={() => alert("Form daftar ulang (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/daftar-ulang")({ component: DaftarUlangPage });

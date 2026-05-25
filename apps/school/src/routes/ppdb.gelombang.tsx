import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_gelombang: string; tahun_ajaran?: string; tanggal_buka?: string; tanggal_tutup?: string; kuota?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_gelombang", header: "Nama", sortable: true, cell: (r) => r.nama_gelombang },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "tanggal_buka", header: "Buka", sortable: true, cell: (r) => r.tanggal_buka ?? "—" },
  { key: "tanggal_tutup", header: "Tutup", cell: (r) => r.tanggal_tutup ?? "—" },
  { key: "kuota", header: "Kuota", align: "right", cell: (r) => r.kuota ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Buka" ? "success" : r.status === "Tutup" ? "neutral" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function GelombangPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="PPDB"
      title="Gelombang PPDB"
      doctype="Gelombang PPDB"
      fields={["name", "nama_gelombang", "tahun_ajaran", "tanggal_buka", "tanggal_tutup", "kuota", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_buka", dir: "desc" }}
      searchFields={["name", "nama_gelombang"]}
      addLabel="Buat Gelombang"
      onAdd={() => alert("Form gelombang (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/gelombang")({ component: GelombangPage });

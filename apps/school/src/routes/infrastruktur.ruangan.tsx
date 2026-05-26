import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama: string; nama_ruangan?: string; jenis?: string; jenis_ruangan?: string; lantai?: string; kapasitas?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama", sortable: true, cell: (r) => r.nama },
  { key: "jenis_ruangan", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_ruangan ?? "—"}</Badge> },
  { key: "lantai", header: "Lantai", cell: (r) => r.lantai ?? "—" },
  { key: "kapasitas", header: "Kapasitas", align: "right", cell: (r) => r.kapasitas ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Perbaikan" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function RuanganPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Ruangan"
      doctype="Ruangan"
      fields={["name", "nama", "jenis_ruangan", "lantai", "kapasitas", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis_ruangan",
          options: ["Semua", "Kelas", "Lab", "Perpustakaan", "Aula", "Kantor", "Toilet", "Gudang"].map((v) => ({ value: v, label: v })) },
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Aktif", "Perbaikan", "Tidak Aktif"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Tambah Ruangan"
      onAdd={() => alert("Form ruangan (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/ruangan")({ component: RuanganPage });

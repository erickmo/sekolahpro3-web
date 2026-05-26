import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama: string; nama_gedung?: string; jumlah_lantai?: number; alamat?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Gedung", sortable: true, cell: (r) => r.nama },
  { key: "jumlah_lantai", header: "Lantai", align: "right", cell: (r) => r.jumlah_lantai ?? "—" },
  { key: "alamat", header: "Alamat", cell: (r) => r.alamat ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function GedungPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Gedung"
      doctype="Gedung"
      fields={["name", "nama", "jumlah_lantai", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah Gedung"
      onAdd={() => alert("Form gedung (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/daftar")({ component: GedungPage });

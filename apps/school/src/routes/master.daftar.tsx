import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_sekolah: string; npsn?: string; alamat?: string; jenjang?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_sekolah", header: "Nama Sekolah", sortable: true, cell: (r) => r.nama_sekolah },
  { key: "npsn", header: "NPSN", cell: (r) => <span className="font-mono text-xs">{r.npsn ?? "—"}</span> },
  { key: "jenjang", header: "Jenjang", cell: (r) => <Badge tone="neutral">{r.jenjang ?? "—"}</Badge> },
  { key: "alamat", header: "Alamat", cell: (r) => r.alamat ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function SekolahPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Sekolah"
      doctype="Sekolah"
      fields={["name", "nama_sekolah", "npsn", "alamat", "jenjang", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_sekolah", dir: "asc" }}
      searchFields={["name", "nama_sekolah", "npsn"]}
      addLabel="Tambah Sekolah"
      onAdd={() => alert("Form sekolah (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/daftar")({ component: SekolahPage });

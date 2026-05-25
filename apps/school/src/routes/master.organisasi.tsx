import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_organisasi: string; jenis?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_organisasi", header: "Nama", sortable: true, cell: (r) => r.nama_organisasi },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function OrganisasiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Organisasi"
      doctype="Organisasi"
      fields={["name", "nama_organisasi", "jenis", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_organisasi", dir: "asc" }}
      searchFields={["name", "nama_organisasi"]}
      addLabel="Tambah Organisasi"
      onAdd={() => alert("Form organisasi (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/organisasi")({ component: OrganisasiPage });

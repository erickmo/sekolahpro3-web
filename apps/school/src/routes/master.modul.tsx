import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_modul: string; enabled?: number; deskripsi?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_modul", header: "Modul", sortable: true, cell: (r) => r.nama_modul },
  { key: "enabled", header: "Status",
    cell: (r) => <Badge tone={r.enabled ? "success" : "neutral"} dot>{r.enabled ? "Aktif" : "Nonaktif"}</Badge> },
  { key: "deskripsi", header: "Deskripsi", cell: (r) => r.deskripsi ?? "—" },
];

function ModulPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Modul Aktif"
      description="Toggle modul yang dipakai per tenant."
      doctype="Modul Aktif"
      fields={["name", "nama_modul", "enabled", "deskripsi"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_modul", dir: "asc" }}
      searchFields={["name", "nama_modul"]}
    />
  );
}

export const Route = createFileRoute("/master/modul")({ component: ModulPage });

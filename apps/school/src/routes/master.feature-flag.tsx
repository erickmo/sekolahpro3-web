import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; flag_name: string; enabled?: number; deskripsi?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "flag_name", header: "Flag", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.flag_name}</span> },
  { key: "enabled", header: "Status",
    cell: (r) => <Badge tone={r.enabled ? "success" : "neutral"} dot>{r.enabled ? "On" : "Off"}</Badge> },
  { key: "deskripsi", header: "Deskripsi", cell: (r) => r.deskripsi ?? "—" },
];

function FeatureFlagPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Feature Flag"
      doctype="Feature Flag"
      fields={["name", "flag_name", "enabled", "deskripsi"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "flag_name", dir: "asc" }}
      searchFields={["name", "flag_name"]}
      addLabel="Tambah Flag"
      onAdd={() => alert("Form feature flag (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/feature-flag")({ component: FeatureFlagPage });

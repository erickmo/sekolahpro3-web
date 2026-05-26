import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { FEATURE_FLAG_FIELDS } from "../components/master/schemas";

type Row = { name: string; key: string; enabled?: number; description?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "key", header: "Flag", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.key}</span> },
  { key: "enabled", header: "Status",
    cell: (r) => <Badge tone={r.enabled ? "success" : "neutral"} dot>{r.enabled ? "On" : "Off"}</Badge> },
  { key: "description", header: "Deskripsi", cell: (r) => r.description ?? "—" },
];

function FeatureFlagPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Master Data"
      title="Feature Flag"
      doctype="Feature Flag"
      fields={["name", "key", "enabled", "description"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "key", dir: "asc" }}
      searchFields={["name", "key"]}
      addLabel="Tambah Flag"
      detailRoute="/master/feature-flag/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Feature Flag"
      formFields={FEATURE_FLAG_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/feature-flag")({ component: FeatureFlagPage });

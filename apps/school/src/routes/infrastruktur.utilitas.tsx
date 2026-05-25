import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; gedung?: string; jenis_utilitas?: string; provider?: string; nomor_meter?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "jenis_utilitas", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_utilitas ?? "—"}</Badge> },
  { key: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
  { key: "nomor_meter", header: "No. Meter", cell: (r) => <span className="font-mono text-xs">{r.nomor_meter ?? "—"}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Gangguan" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function UtilitasPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Utilitas Gedung"
      description="PLN, PDAM, internet, gas, dll."
      doctype="Utilitas Gedung"
      fields={["name", "gedung", "jenis_utilitas", "provider", "nomor_meter", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung", "provider"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis_utilitas",
          options: ["Semua", "Listrik", "Air", "Internet", "Gas", "Telepon"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Tambah Utilitas"
      onAdd={() => alert("Form utilitas (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/utilitas")({ component: UtilitasPage });

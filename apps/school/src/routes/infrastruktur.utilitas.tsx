import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; gedung?: string; jenis?: string; jenis_utilitas?: string; provider?: string; nomor_meter?: string; nomor_pelanggan?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
  { key: "nomor_pelanggan", header: "No. Meter", cell: (r) => <span className="font-mono text-xs">{r.nomor_pelanggan ?? "—"}</span> },
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
      fields={["name", "gedung", "jenis", "provider", "nomor_pelanggan", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung", "provider"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis",
          options: ["Semua", "Listrik", "Air", "Internet", "Gas", "Telepon"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Tambah Utilitas"
      onAdd={() => alert("Form utilitas (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/utilitas")({ component: UtilitasPage });

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { UtilitasGedungFormModal } from "../components/infrastruktur/UtilitasGedungFormModal";

type Row = { name: string; gedung?: string; jenis?: string; jenis_utilitas?: string; provider?: string; nomor_meter?: string; nomor_pelanggan?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
  { key: "nomor_pelanggan", header: "No. Pelanggan", cell: (r) => <span className="font-mono text-xs">{r.nomor_pelanggan ?? "—"}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Nonaktif" ? "neutral" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function UtilitasPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
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
            options: ["Semua", "Listrik", "Air", "Internet", "Gas", "Lainnya"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Tambah Utilitas"
        onAdd={() => setShowCreate(true)}
      />
      <UtilitasGedungFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/utilitas")({ component: UtilitasPage });

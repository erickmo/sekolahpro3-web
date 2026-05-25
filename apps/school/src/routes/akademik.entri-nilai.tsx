import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; mata_pelajaran: string; kelas?: string; guru?: string; status?: string; tanggal?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "mata_pelajaran", header: "Mapel", sortable: true, cell: (r) => r.mata_pelajaran },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "guru", header: "Guru", cell: (r) => r.guru ?? "—" },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Final" ? "success" : r.status === "Draft" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function EntriNilaiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Entri Nilai"
      description="Sesi input nilai per mapel & kelas."
      doctype="Entri Nilai"
      fields={["name", "mata_pelajaran", "kelas", "guru", "status", "tanggal"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name", "mata_pelajaran"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Draft", "Final", "Dikunci"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Mulai Entri"
      onAdd={() => alert("Form entri nilai (P2)")}
    />
  );
}

export const Route = createFileRoute("/akademik/entri-nilai")({ component: EntriNilaiPage });

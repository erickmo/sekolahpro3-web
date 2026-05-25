import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; siswa: string; kelas?: string; semester?: string; rata_rata?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Raport", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "semester", header: "Semester", cell: (r) => r.semester ?? "—" },
  { key: "rata_rata", header: "Rata-rata", align: "right",
    cell: (r) => r.rata_rata !== undefined ? <span className="tabular-nums">{r.rata_rata.toFixed(2)}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Diterbitkan" ? "success" : r.status === "Draft" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function RaportPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Raport"
      doctype="Raport"
      fields={["name", "siswa", "kelas", "semester", "rata_rata", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Draft", "Disetujui", "Diterbitkan"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Generate Raport"
      onAdd={() => alert("Form raport (P2)")}
    />
  );
}

export const Route = createFileRoute("/akademik/raport")({ component: RaportPage });

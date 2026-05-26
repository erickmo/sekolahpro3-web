import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; tanggal: string; kelas?: string; jumlah_hadir?: number; jumlah_izin?: number; jumlah_sakit?: number; jumlah_alpa?: number; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "jumlah_hadir", header: "H", align: "right", cell: (r) => r.jumlah_hadir ?? 0 },
  { key: "jumlah_izin", header: "I", align: "right", cell: (r) => r.jumlah_izin ?? 0 },
  { key: "jumlah_sakit", header: "S", align: "right", cell: (r) => r.jumlah_sakit ?? 0 },
  { key: "jumlah_alpa", header: "A", align: "right",
    cell: (r) => <span className={r.jumlah_alpa && r.jumlah_alpa > 0 ? "text-rose-500" : ""}>{r.jumlah_alpa ?? 0}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Final" ? "success" : r.status === "Draft" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function HarianPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Absensi"
      title="Absensi Harian"
      doctype="Absensi Harian"
      fields={["name", "tanggal"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name"]}
      addLabel="Input Absensi"
      onAdd={() => alert("Form absensi harian (P2)")}
    />
  );
}

export const Route = createFileRoute("/absensi/daftar")({ component: HarianPage });

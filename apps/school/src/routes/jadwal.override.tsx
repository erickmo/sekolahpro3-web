import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; tanggal: string; alasan?: string; tipe_override?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "tipe_override", header: "Tipe", cell: (r) => <Badge tone="neutral">{r.tipe_override ?? "—"}</Badge> },
  { key: "alasan", header: "Alasan", cell: (r) => r.alasan ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function JadwalOverridePage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Jadwal"
      title="Jadwal Override"
      description="Override jadwal pada tanggal tertentu (libur, hari khusus, ujian)."
      doctype="Jadwal Override"
      fields={["name", "tanggal", "alasan", "tipe_override", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name", "alasan"]}
      addLabel="Tambah Override"
      onAdd={() => alert("Form jadwal override (P2)")}
    />
  );
}

export const Route = createFileRoute("/jadwal/override")({ component: JadwalOverridePage });

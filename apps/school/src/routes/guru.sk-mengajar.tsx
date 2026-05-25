import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; guru: string; nomor_sk?: string; tanggal_sk?: string; berlaku_mulai?: string; berlaku_sampai?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "nomor_sk", header: "No. SK", cell: (r) => <span className="font-mono text-xs">{r.nomor_sk ?? "—"}</span> },
  { key: "tanggal_sk", header: "Tgl SK", sortable: true, cell: (r) => r.tanggal_sk ?? "—" },
  { key: "berlaku_mulai", header: "Berlaku Mulai", cell: (r) => r.berlaku_mulai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Berakhir" ? "neutral" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function SkMengajarPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Guru"
      title="SK Mengajar"
      doctype="SK Mengajar"
      fields={["name", "guru", "nomor_sk", "tanggal_sk", "berlaku_mulai", "berlaku_sampai", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_sk", dir: "desc" }}
      searchFields={["name", "guru", "nomor_sk"]}
      addLabel="Terbitkan SK"
      onAdd={() => alert("Form SK Mengajar (P2)")}
    />
  );
}

export const Route = createFileRoute("/guru/sk-mengajar")({ component: SkMengajarPage });

import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  jenis_dana: string;
  nasabah?: string;
  jumlah: number;
  tanggal: string;
  status?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "jenis_dana", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_dana}</Badge> },
  { key: "nasabah", header: "Muzakki/Sumber", cell: (r) => r.nasabah ?? "—" },
  { key: "jumlah", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.jumlah.toLocaleString("id-ID")}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Diterima" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function ZisPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="ZIS (Zakat, Infak, Sedekah)"
      description="Penerimaan & penyaluran dana sosial."
      doctype="Penerimaan ZIS"
      fields={["name", "jenis_dana", "nasabah", "jumlah", "tanggal"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name", "nasabah"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis_dana",
          options: ["Semua", "Zakat", "Infak", "Sedekah", "Wakaf Tunai"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Catat Penerimaan"
      onAdd={() => alert("Form penerimaan ZIS (P2)")}
    />
  );
}

export const Route = createFileRoute("/koperasi/zis")({ component: ZisPage });

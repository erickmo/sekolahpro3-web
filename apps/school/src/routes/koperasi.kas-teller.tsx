import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  teller: string;
  tanggal_buka: string;
  tanggal_tutup?: string;
  saldo_awal: number;
  saldo_akhir?: number;
  status: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Sesi", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "teller", header: "Teller", sortable: true, cell: (r) => r.teller },
  { key: "tanggal_buka", header: "Buka", sortable: true, cell: (r) => r.tanggal_buka },
  { key: "tanggal_tutup", header: "Tutup", cell: (r) => r.tanggal_tutup ?? "—" },
  { key: "saldo_awal", header: "Saldo Awal", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.saldo_awal.toLocaleString("id-ID")}</span> },
  { key: "saldo_akhir", header: "Saldo Akhir", align: "right",
    cell: (r) => r.saldo_akhir !== undefined ? <span className="tabular-nums">Rp {r.saldo_akhir.toLocaleString("id-ID")}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Buka" ? "brand" : r.status === "Tutup" ? "success" : r.status === "Selisih" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function KasTellerPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Sesi Kas Teller"
      description="Buka/tutup sesi kas + rekonsiliasi denominasi."
      doctype="Sesi Kas Teller"
      fields={["name", "teller", "tanggal_buka", "tanggal_tutup", "saldo_awal", "saldo_akhir", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_buka", dir: "desc" }}
      searchFields={["name", "teller"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Buka", "Tutup", "Selisih"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Buka Sesi"
      onAdd={() => alert("Form buka sesi kas (P2)")}
    />
  );
}

export const Route = createFileRoute("/koperasi/kas-teller")({ component: KasTellerPage });

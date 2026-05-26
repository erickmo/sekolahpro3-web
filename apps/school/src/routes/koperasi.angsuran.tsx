import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";

type Row = {
  name: string;
  akad?: string;
  ke?: number;
  jatuh_tempo?: string;
  total?: number;
  status: string;
  tanggal_bayar?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "akad", header: "Ref Akad", cell: (r) => <span className="font-mono text-xs">{r.akad ?? "—"}</span> },
  { key: "ke", header: "Angsuran #", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.ke ?? "—"}</span> },
  { key: "jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.jatuh_tempo ?? "—" },
  { key: "total", header: "Nominal", align: "right",
    cell: (r) => r.total !== undefined ? <span className="tabular-nums">Rp {r.total.toLocaleString("id-ID")}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lunas" ? "success" : r.status === "Tunggakan" ? "danger" : r.status === "Belum" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function AngsuranPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Jadwal & Pembayaran Angsuran"
      doctype="Jadwal Angsuran"
      fields={["name", "ke", "total", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "ke", dir: "asc" }}
      searchFields={["name"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Belum", "Lunas", "Tunggakan"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Bayar Angsuran"
      onAdd={() => alert("Form pembayaran angsuran (P2)")}
    />
  );
}

export const Route = createFileRoute("/koperasi/angsuran")({ component: AngsuranPage });

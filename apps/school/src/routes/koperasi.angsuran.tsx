import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";

type Row = {
  name: string;
  akad: string;
  angsuran_ke: number;
  jatuh_tempo: string;
  nominal: number;
  status: string;
  tanggal_bayar?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "akad", header: "Ref Akad", cell: (r) => <span className="font-mono text-xs">{r.akad}</span> },
  { key: "angsuran_ke", header: "Angsuran #", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.angsuran_ke}</span> },
  { key: "jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.jatuh_tempo },
  { key: "nominal", header: "Nominal", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.nominal.toLocaleString("id-ID")}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lunas" ? "success" : r.status === "Tunggakan" ? "danger" : r.status === "Belum" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function AngsuranPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Jadwal & Pembayaran Angsuran"
      doctype="Jadwal Angsuran"
      fields={["name", "akad", "angsuran_ke", "jatuh_tempo", "nominal", "status", "tanggal_bayar"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "jatuh_tempo", dir: "asc" }}
      searchFields={["name", "akad"]}
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

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { TransaksiModal } from "../components/koperasi-simpanan/transaksiForm";

type Row = {
  name: string;
  rekening: string;
  jenis: string;
  nominal: number;
  saldo_akhir?: number;
  tanggal: string;
  teller?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Transaksi", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "rekening", header: "Rekening", cell: (r) => <span className="font-mono text-xs">{r.rekening}</span> },
  { key: "jenis", header: "Jenis",
    cell: (r) => <Badge tone={r.jenis === "Setor" ? "success" : r.jenis === "Tarik" ? "warning" : r.jenis === "Transfer" ? "brand" : "neutral"}>{r.jenis}</Badge> },
  { key: "nominal", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.nominal.toLocaleString("id-ID")}</span> },
  { key: "saldo_akhir", header: "Saldo Akhir", align: "right",
    cell: (r) => r.saldo_akhir !== undefined ? <span className="tabular-nums">Rp {r.saldo_akhir.toLocaleString("id-ID")}</span> : "—" },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
];

function TransaksiPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Transaksi Simpanan"
        description="Setor, tarik, transfer, dan mutasi rekening."
        doctype="Transaksi Simpanan"
        fields={["name", "rekening", "jenis", "nominal", "saldo_akhir", "tanggal", "teller"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name", "rekening"]}
        selectFilters={[
          { key: "jenis", label: "Jenis", field: "jenis",
            options: ["Semua", "Setor", "Tarik", "Transfer", "Bagi Hasil", "Koreksi"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Transaksi Baru"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/koperasi/transaksi/$name", params: { name: r.name } })}
      />
      <TransaksiModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/koperasi/transaksi")({ component: TransaksiPage });

import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { TopUpModal, TransaksiKartuModal } from "../components/koperasi-kartu/EmoneyModals";

type Row = {
  name: string;
  kartu: string;
  tipe: string;
  jenis?: string;
  nominal: number;
  merchant?: string;
  terminal_id?: string;
  tanggal?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "kartu", header: "Kartu", cell: (r) => <span className="font-mono text-xs">{r.kartu}</span> },
  { key: "tipe", header: "Jenis",
    cell: (r) => <Badge tone={r.tipe === "Top-up" ? "success" : r.tipe === "Bayar" ? "brand" : "neutral"}>{r.tipe}</Badge> },
  { key: "nominal", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.nominal.toLocaleString("id-ID")}</span> },
  { key: "merchant", header: "Merchant", cell: (r) => r.merchant ?? "—" },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal ?? "—" },
];

function EmoneyPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [bayarOpen, setBayarOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="E-Money & Transaksi Kartu"
        description="Top-up dan transaksi kartu di merchant/terminal."
        doctype="Transaksi Kartu"
        fields={["name", "kartu", "tipe", "nominal", "merchant", "terminal_id"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "kartu"]}
        selectFilters={[
          { key: "tipe", label: "Jenis", field: "tipe",
            options: ["Semua", "Top-up", "Bayar", "Refund"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Top-up"
        onAdd={() => setTopUpOpen(true)}
        onRowClick={(r) => navigate({ to: "/$sekolah/koperasi/emoney/$name", params: { sekolah, name: r.name } })}
        extraActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setBayarOpen(true)}>Catat Bayar</Button>
            <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>Refund</Button>
          </>
        }
      />
      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <TransaksiKartuModal open={bayarOpen} onClose={() => setBayarOpen(false)} jenis="Bayar" title="Catat Bayar Kartu" />
      <TransaksiKartuModal open={refundOpen} onClose={() => setRefundOpen(false)} jenis="Refund" title="Catat Refund Kartu" />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi/emoney")({ component: EmoneyPage });

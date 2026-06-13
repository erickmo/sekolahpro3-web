import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { TopUpModal, TransaksiKartuModal } from "../components/koperasi-kartu/EmoneyModals";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Field contract per backend Transaksi Kartu: tipe lowercase
// (pembayaran|topup|refund), status (sukses|gagal|pending), terminal_id —
// tidak ada kolom merchant/tanggal.
type Row = {
  name: string;
  kartu: string;
  tipe: string;
  nominal: number;
  status?: string;
  terminal_id?: string;
};

const TIPE_LABEL: Record<string, string> = {
  topup: "Top-up",
  pembayaran: "Bayar",
  refund: "Refund",
};

const STATUS_TONE: Record<string, "success" | "danger" | "warning"> = {
  sukses: "success",
  gagal: "danger",
  pending: "warning",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "kartu", header: "Kartu", cell: (r) => <span className="font-mono text-xs">{r.kartu}</span> },
  { key: "tipe", header: "Jenis",
    cell: (r) => <Badge tone={r.tipe === "topup" ? "success" : r.tipe === "pembayaran" ? "brand" : "neutral"}>{TIPE_LABEL[r.tipe] ?? r.tipe}</Badge> },
  { key: "nominal", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.nominal.toLocaleString("id-ID")}</span> },
  { key: "terminal_id", header: "Terminal", cell: (r) => r.terminal_id ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => r.status ? <Badge tone={STATUS_TONE[r.status] ?? "warning"} dot>{r.status}</Badge> : "—" },
];

function EmoneyPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const navigate = useNavigate();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [bayarOpen, setBayarOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <>
      <KoperasiPageGuide id="emoney" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="E-Money & Transaksi Kartu"
        description="Top-up dan transaksi kartu di merchant/terminal."
        doctype="Transaksi Kartu"
        fields={["name", "kartu", "tipe", "nominal", "status", "terminal_id"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "kartu"]}
        selectFilters={[
          { key: "tipe", label: "Jenis", field: "tipe",
            options: [
              { value: "Semua", label: "Semua" },
              { value: "topup", label: "Top-up" },
              { value: "pembayaran", label: "Bayar" },
              { value: "refund", label: "Refund" },
            ] },
        ]}
        addLabel="Top-up"
        onAdd={() => setTopUpOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/emoney/$name", params: { sekolah, name: r.name } })}
        extraActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setBayarOpen(true)}>Catat Bayar</Button>
            <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>Refund</Button>
          </>
        }
      />
      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <TransaksiKartuModal open={bayarOpen} onClose={() => setBayarOpen(false)} tipe="pembayaran" title="Catat Bayar Kartu" />
      <TransaksiKartuModal open={refundOpen} onClose={() => setRefundOpen(false)} tipe="refund" title="Catat Refund Kartu" />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/emoney")({ component: EmoneyPage });

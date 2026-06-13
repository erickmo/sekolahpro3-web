import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { WalletFormModal } from "../components/koperasi-kartu/WalletFormModal";
import { TopUpModal } from "../components/koperasi-kartu/EmoneyModals";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Field contract per backend E-Money Wallet (e_money_wallet.json).
type Row = {
  name: string;
  kartu: string;
  saldo?: number;
  batas_saldo?: number;
  auto_topup?: 0 | 1;
  rekening_sumber?: string;
};

function rupiah(n: number | undefined): string {
  return n !== undefined ? `Rp ${n.toLocaleString("id-ID")}` : "—";
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Wallet", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "kartu", header: "Kartu", cell: (r) => <span className="font-mono text-xs">{r.kartu}</span> },
  { key: "saldo", header: "Saldo", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums font-medium">{rupiah(r.saldo)}</span> },
  { key: "batas_saldo", header: "Batas", align: "right",
    cell: (r) => <span className="tabular-nums text-muted-fg">{rupiah(r.batas_saldo)}</span> },
  { key: "auto_topup", header: "Auto Top-up",
    cell: (r) => r.auto_topup ? <Badge tone="success" dot>Aktif</Badge> : <span className="text-xs text-muted-fg">Mati</span> },
  { key: "rekening_sumber", header: "Rekening Sumber", cell: (r) => r.rekening_sumber ?? "—" },
];

export function WalletPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  return (
    <>
      <KoperasiPageGuide id="wallet" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Wallet E-Money"
        description="Saldo e-money per kartu + konfigurasi auto top-up."
        doctype="E-Money Wallet"
        fields={["name", "kartu", "saldo", "batas_saldo", "auto_topup", "rekening_sumber"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "modified", dir: "desc" }}
        searchFields={["name", "kartu"]}
        selectFilters={[
          { key: "auto", label: "Auto Top-up", field: "auto_topup",
            options: [
              { value: "Semua", label: "Semua" },
              { value: "1", label: "Aktif" },
              { value: "0", label: "Mati" },
            ] },
        ]}
        addLabel="Buat Wallet"
        onAdd={() => setCreateOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/wallet/$name", params: { sekolah, name: r.name } })}
        extraActions={
          <Button variant="outline" onClick={() => setTopUpOpen(true)}>Top-up</Button>
        }
      />
      <WalletFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/wallet")({ component: WalletPage });

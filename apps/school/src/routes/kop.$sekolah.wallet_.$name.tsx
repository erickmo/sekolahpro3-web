import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  DataTable,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  IconArrowLeft,
  IconWallet,
  type Column,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import { WalletFormModal, type WalletEditable } from "../components/koperasi-kartu/WalletFormModal";
import { TopUpModal } from "../components/koperasi-kartu/EmoneyModals";

const DOCTYPE = "E-Money Wallet";

interface WalletDoc extends WalletEditable {
  saldo?: number;
}

// Riwayat Top Up wallet ini — tidak ada field tanggal; pakai creation.
interface TopUpRow {
  name: string;
  nominal?: number;
  tipe?: string;
  status?: string;
  sumber?: string;
  creation?: string;
}

const TOPUP_STATUS_TONE: Record<string, "success" | "danger" | "warning"> = {
  sukses: "success",
  gagal: "danger",
  pending: "warning",
};

function rupiah(n: number | undefined): string {
  return n !== undefined ? `Rp ${n.toLocaleString("id-ID")}` : "—";
}

export function WalletDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const docQ = useResourceDoc<WalletDoc>(DOCTYPE, name);
  const topUpQ = useResourceList<TopUpRow>("Top Up", {
    fields: ["name", "nominal", "tipe", "status", "sumber", "creation"],
    filters: [["wallet", "=", name]],
    order_by: "creation desc",
    limit_page_length: 50,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const doc = docQ.data;

  if (docQ.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat wallet...</div>;
  }
  if (docQ.isError || !doc) {
    return (
      <div className="py-16">
        <EmptyState
          title="Wallet tidak ditemukan"
          description={(docQ.error as Error | undefined)?.message ?? "Periksa ID wallet atau kembali ke daftar."}
          action={
            <Link to="/kop/$sekolah/wallet" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const topUps = topUpQ.data ?? [];
  const cols: Column<TopUpRow>[] = [
    { key: "name", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: "creation", header: "Waktu", cell: (r) => r.creation?.slice(0, 16) ?? "—" },
    { key: "tipe", header: "Tipe", cell: (r) => <Badge tone="neutral">{r.tipe ?? "—"}</Badge> },
    { key: "sumber", header: "Sumber", cell: (r) => r.sumber ?? "Tunai" },
    { key: "nominal", header: "Nominal", align: "right",
      cell: (r) => <span className="tabular-nums">{rupiah(r.nominal)}</span> },
    { key: "status", header: "Status",
      cell: (r) => r.status ? <Badge tone={TOPUP_STATUS_TONE[r.status] ?? "warning"} dot>{r.status}</Badge> : "—" },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Wallet E-Money", render: ({ className, children }) => <Link to="/kop/$sekolah/wallet" params={{ sekolah }} className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Wallet"
            title={doc.name}
            description={`Kartu ${doc.kartu}`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/wallet", params: { sekolah } })}>
                  <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                  Kembali
                </Button>
                <Button variant="outline" onClick={() => setEditOpen(true)}>Ubah Konfigurasi</Button>
                <Button onClick={() => setTopUpOpen(true)}>Top-up</Button>
              </div>
            }
          />
        </div>
      }
      stats={
        <>
          <StatCard label="Saldo" value={rupiah(doc.saldo)} icon={<IconWallet />} accent="brand" />
          <StatCard label="Batas Saldo" value={rupiah(doc.batas_saldo)} accent="amber" />
          <StatCard label="Auto Top-up" value={doc.auto_topup ? "Aktif" : "Mati"} accent={doc.auto_topup ? "emerald" : "amber"} />
        </>
      }
      primary={
        <SectionCard title="Riwayat Top-up" description={`${topUps.length} pengisian`} padded={false}>
          <DataTable
            data={topUps}
            columns={cols}
            rowKey={(r) => r.name}
            empty={
              <div>
                <div className="font-medium text-fg">{topUpQ.isLoading ? "Memuat…" : "Belum ada top-up"}</div>
                <div className="text-xs mt-1">Gunakan tombol Top-up untuk mengisi saldo.</div>
              </div>
            }
          />
        </SectionCard>
      }
      side={
        <SectionCard title="Konfigurasi">
          <InfoGrid cols={1}>
            <InfoField label="Wallet" value={<span className="font-mono">{doc.name}</span>} />
            <InfoField label="Kartu" value={<span className="font-mono">{doc.kartu}</span>} />
            <InfoField label="Batas Saldo" value={<span className="tabular-nums">{rupiah(doc.batas_saldo)}</span>} />
            <InfoField label="Auto Top-up" value={doc.auto_topup ? "Aktif" : "Mati"} />
            <InfoField label="Ambang" value={<span className="tabular-nums">{rupiah(doc.threshold_topup)}</span>} />
            <InfoField label="Nominal Auto" value={<span className="tabular-nums">{rupiah(doc.nominal_topup)}</span>} />
            <InfoField label="Rekening Sumber" value={doc.rekening_sumber ?? "—"} />
          </InfoGrid>
        </SectionCard>
      }
      footer={
        <>
          {editOpen ? (
            <WalletFormModal
              open
              onClose={() => setEditOpen(false)}
              wallet={doc}
              onSaved={() => void docQ.refetch()}
            />
          ) : null}
          <TopUpModal
            open={topUpOpen}
            onClose={() => setTopUpOpen(false)}
            defaultKartu={doc.kartu}
            onCreated={() => {
              void docQ.refetch();
              void topUpQ.refetch();
            }}
          />
        </>
      }
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/wallet_/$name")({
  component: WalletDetailPage,
});

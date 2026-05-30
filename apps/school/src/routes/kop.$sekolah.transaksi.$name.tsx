import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  IconArrowLeft,
  IconWallet,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";

interface TransaksiDoc {
  name: string;
  rekening?: string;
  rekening_tujuan?: string;
  jenis?: string;
  nominal?: number;
  saldo_akhir?: number;
  tanggal?: string;
  teller?: string;
  keterangan?: string;
  status?: string;
  creation?: string;
  modified?: string;
  owner?: string;
}

const JENIS_TONE: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  Setor: "success",
  Tarik: "warning",
  Transfer: "brand",
  "Bagi Hasil": "success",
  Koreksi: "neutral",
};

const formatRupiah = (n: number | undefined) =>
  n === undefined ? "—" : `Rp ${n.toLocaleString("id-ID")}`;

function TransaksiDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const q = useResourceDoc<TransaksiDoc>("Transaksi Simpanan", name);
  const t = q.data;

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Transaksi", render: ({ className, children }) => <Link to="/kop/$sekolah/transaksi" params={{ sekolah }} className={className}>{children}</Link> },
              { label: name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Transaksi"
            title={name}
            description={t ? `${t.jenis ?? "—"} · ${t.tanggal ?? "—"}` : "Memuat..."}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/transaksi", params: { sekolah } })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali
              </Button>
            }
          />
        </div>
      }
      primary={
        <div className="space-y-6">
          {q.isError ? (
            <EmptyState
              title="Transaksi tidak ditemukan"
              description={(q.error as Error)?.message ?? "Periksa ID transaksi."}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Nominal" value={formatRupiah(t?.nominal)} accent="brand" icon={<IconWallet />} />
            <StatCard label="Saldo Akhir" value={formatRupiah(t?.saldo_akhir)} accent="emerald" />
            <StatCard
              label="Jenis"
              value={t?.jenis ?? "—"}
              accent={t?.jenis === "Tarik" ? "amber" : "brand"}
            />
          </div>

          <SectionCard
            title="Detail Transaksi"
            action={t?.jenis ? <Badge tone={JENIS_TONE[t.jenis] ?? "neutral"} dot>{t.jenis}</Badge> : null}
          >
            <InfoGrid cols={3}>
              <InfoField label="ID Transaksi" value={<span className="font-mono">{name}</span>} />
              <InfoField label="Tanggal" value={t?.tanggal ?? "—"} />
              <InfoField label="Status" value={t?.status ?? "—"} />
              <InfoField
                label="Rekening"
                value={
                  t?.rekening ? (
                    <Link
                      to="/kop/$sekolah/rekening/$name"
                      params={{ sekolah, name: t.rekening }}
                      className="font-mono text-brand hover:underline"
                    >
                      {t.rekening}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              {t?.rekening_tujuan ? (
                <InfoField
                  label="Rekening Tujuan"
                  value={
                    <Link
                      to="/kop/$sekolah/rekening/$name"
                      params={{ sekolah, name: t.rekening_tujuan }}
                      className="font-mono text-brand hover:underline"
                    >
                      {t.rekening_tujuan}
                    </Link>
                  }
                />
              ) : null}
              <InfoField label="Teller" value={t?.teller ?? "—"} />
              <InfoField label="Nominal" value={formatRupiah(t?.nominal)} />
              <InfoField label="Saldo Akhir" value={formatRupiah(t?.saldo_akhir)} />
              {t?.keterangan ? (
                <InfoField label="Keterangan" value={t.keterangan} className="sm:col-span-3" />
              ) : null}
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Metadata">
            <InfoGrid cols={3}>
              <InfoField label="Dibuat" value={t?.creation ?? "—"} />
              <InfoField label="Diubah" value={t?.modified ?? "—"} />
              <InfoField label="Pemilik" value={t?.owner ?? "—"} />
            </InfoGrid>
          </SectionCard>
        </div>
      }
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/transaksi/$name")({
  component: TransaksiDetailPage,
});

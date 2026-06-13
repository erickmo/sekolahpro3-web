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
  rekening_simpanan?: string;
  jenis?: string;
  jumlah?: number;
  tanggal?: string;
  sesi_kas?: string;
  keterangan?: string;
  approval_status?: string;
  creation?: string;
  modified?: string;
  owner?: string;
}

const JENIS_TONE: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  Setoran: "success",
  Penarikan: "warning",
  "Bagi Hasil": "brand",
  Bunga: "neutral",
};

const APPROVAL_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Otomatis: "neutral",
  "Menunggu Approval": "warning",
  Disetujui: "success",
  Ditolak: "danger",
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

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Nominal" value={formatRupiah(t?.jumlah)} accent="brand" icon={<IconWallet />} />
            <StatCard
              label="Jenis"
              value={t?.jenis ?? "—"}
              accent={t?.jenis === "Penarikan" ? "amber" : "brand"}
            />
          </div>

          <SectionCard
            title="Detail Transaksi"
            action={t?.jenis ? <Badge tone={JENIS_TONE[t.jenis] ?? "neutral"} dot>{t.jenis}</Badge> : null}
          >
            <InfoGrid cols={3}>
              <InfoField label="ID Transaksi" value={<span className="font-mono">{name}</span>} />
              <InfoField label="Tanggal" value={t?.tanggal ?? "—"} />
              <InfoField
                label="Status Approval"
                value={
                  t?.approval_status ? (
                    <Badge tone={APPROVAL_TONE[t.approval_status] ?? "neutral"} dot>
                      {t.approval_status}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoField
                label="Rekening"
                value={
                  t?.rekening_simpanan ? (
                    <Link
                      to="/kop/$sekolah/rekening/$name"
                      params={{ sekolah, name: t.rekening_simpanan }}
                      className="font-mono text-brand hover:underline"
                    >
                      {t.rekening_simpanan}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoField label="Sesi Kas" value={t?.sesi_kas ?? "—"} />
              <InfoField label="Nominal" value={formatRupiah(t?.jumlah)} />
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

export const Route = createFileRoute("/kop/$sekolah/transaksi_/$name")({
  component: TransaksiDetailPage,
});

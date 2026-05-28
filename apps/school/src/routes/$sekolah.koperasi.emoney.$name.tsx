import { createFileRoute } from "@tanstack/react-router";
import { Badge, InfoField, InfoGrid, SectionCard } from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { DetailShell, ErrorState, LoadingState, formatRupiah, formatTanggal } from "../components/koperasi-kartu/shared";

type Trx = {
  name: string;
  kartu: string;
  jenis: string;
  nominal: number;
  merchant?: string;
  terminal?: string;
  tanggal: string;
  status?: string;
};

function EmoneyDetail() {
  const { name } = Route.useParams();
  const q = useResourceDoc<Trx>("Transaksi Kartu", name);
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} />;
  const t = q.data;
  const tone = t.jenis === "Top-up" ? "success" : t.jenis === "Bayar" ? "brand" : t.jenis === "Refund" ? "warning" : "neutral";
  return (
    <DetailShell
      eyebrow="Transaksi Kartu"
      title={t.name}
      description={`${t.jenis} · Kartu ${t.kartu}`}
      backTo="/$sekolah/koperasi/emoney"
      backLabel="Kembali ke daftar"
      crumbParentLabel="E-Money"
      crumbParentTo="/$sekolah/koperasi/emoney"
    >
      <SectionCard title="Detail Transaksi">
        <InfoGrid cols={2}>
          <InfoField label="ID" value={<span className="font-mono">{t.name}</span>} />
          <InfoField label="Kartu" value={<span className="font-mono">{t.kartu}</span>} />
          <InfoField label="Jenis" value={<Badge tone={tone}>{t.jenis}</Badge>} />
          <InfoField label="Nominal" value={<span className="tabular-nums font-semibold">{formatRupiah(t.nominal)}</span>} />
          <InfoField label="Merchant" value={t.merchant ?? "—"} />
          <InfoField label="Terminal" value={t.terminal ?? "—"} />
          <InfoField label="Tanggal" value={formatTanggal(t.tanggal)} />
          {t.status ? <InfoField label="Status" value={<Badge tone="neutral" dot>{t.status}</Badge>} /> : null}
        </InfoGrid>
      </SectionCard>
    </DetailShell>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi/emoney/$name")({ component: EmoneyDetail });

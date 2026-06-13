import { createFileRoute } from "@tanstack/react-router";
import { Badge, InfoField, InfoGrid, SectionCard } from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { DetailShell, ErrorState, LoadingState, formatRupiah, formatTanggal } from "../components/koperasi-kartu/shared";

type Trx = {
  name: string;
  kartu: string;
  tipe: string;
  nominal: number;
  terminal_id?: string;
  status?: string;
  creation?: string;
};

const TIPE_LABEL: Record<string, string> = {
  topup: "Top-up",
  pembayaran: "Bayar",
  refund: "Refund",
};

const STATUS_LABEL: Record<string, string> = {
  sukses: "Sukses",
  gagal: "Gagal",
  pending: "Pending",
};

function EmoneyDetail() {
  const { name } = Route.useParams();
  const q = useResourceDoc<Trx>("Transaksi Kartu", name);
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} />;
  const t = q.data;
  const tone = t.tipe === "topup" ? "success" : t.tipe === "pembayaran" ? "brand" : "neutral";
  const statusTone = t.status === "sukses" ? "success" : t.status === "gagal" ? "danger" : "warning";
  return (
    <DetailShell
      eyebrow="Transaksi Kartu"
      title={t.name}
      description={`${TIPE_LABEL[t.tipe] ?? t.tipe} · Kartu ${t.kartu}`}
      backTo="/kop/$sekolah/emoney"
      backLabel="Kembali ke daftar"
      crumbParentLabel="E-Money"
      crumbParentTo="/kop/$sekolah/emoney"
    >
      <SectionCard title="Detail Transaksi">
        <InfoGrid cols={2}>
          <InfoField label="ID" value={<span className="font-mono">{t.name}</span>} />
          <InfoField label="Kartu" value={<span className="font-mono">{t.kartu}</span>} />
          <InfoField label="Jenis" value={<Badge tone={tone}>{TIPE_LABEL[t.tipe] ?? t.tipe}</Badge>} />
          <InfoField label="Nominal" value={<span className="tabular-nums font-semibold">{formatRupiah(t.nominal)}</span>} />
          <InfoField label="Terminal" value={t.terminal_id ?? "—"} />
          <InfoField label="Dibuat" value={formatTanggal(t.creation)} />
          {t.status ? <InfoField label="Status" value={<Badge tone={statusTone} dot>{STATUS_LABEL[t.status] ?? t.status}</Badge>} /> : null}
        </InfoGrid>
      </SectionCard>
    </DetailShell>
  );
}

export const Route = createFileRoute("/kop/$sekolah/emoney_/$name")({ component: EmoneyDetail });

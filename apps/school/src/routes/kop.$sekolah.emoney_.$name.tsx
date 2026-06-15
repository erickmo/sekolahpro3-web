import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Badge, InfoField, InfoGrid, SectionCard } from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { DetailShell, ErrorState, LoadingState, formatRupiah, formatTanggal } from "../components/koperasi-kartu/shared";

type Trx = {
  name: string;
  kartu: string;
  tipe: string;
  nominal: number;
  terminal_id?: string;
  referensi?: string;
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
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
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
          <InfoField
            label="Kartu"
            value={
              <Link to="/kop/$sekolah/kartu/$name" params={{ sekolah, name: t.kartu }} className="font-mono text-brand hover:underline">
                {t.kartu}
              </Link>
            }
          />
          <InfoField label="Jenis" value={<Badge tone={tone}>{TIPE_LABEL[t.tipe] ?? t.tipe}</Badge>} />
          <InfoField label="Nominal" value={<span className="tabular-nums font-semibold">{formatRupiah(t.nominal)}</span>} />
          <InfoField label="Terminal" value={t.terminal_id ?? "—"} />
          <InfoField label="Referensi" value={t.referensi ?? "—"} />
          <InfoField label="Dibuat" value={formatTanggal(t.creation)} />
          {t.status ? <InfoField label="Status" value={<Badge tone={statusTone} dot>{STATUS_LABEL[t.status] ?? t.status}</Badge>} /> : null}
        </InfoGrid>
      </SectionCard>
    </DetailShell>
  );
}

export const Route = createFileRoute("/kop/$sekolah/emoney_/$name")({ component: EmoneyDetail });

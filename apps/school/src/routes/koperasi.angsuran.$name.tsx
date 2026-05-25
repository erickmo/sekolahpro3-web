import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  IconArrowLeft,
  type Column,
} from "@sekolahpro/ui";
import {
  useResourceDoc,
  useResourceList,
  type ListParams,
} from "@sekolahpro/api-client";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";

const JADWAL_DOCTYPE = "Jadwal Angsuran";
const PEMBAYARAN_DOCTYPE = "Pembayaran Angsuran";

interface JadwalDoc {
  name: string;
  akad?: string;
  angsuran_ke?: number;
  jatuh_tempo?: string;
  nominal?: number;
  status?: string;
  tanggal_bayar?: string;
}

interface PembayaranRow {
  name: string;
  jadwal: string;
  akad: string;
  tanggal_bayar: string;
  metode: string;
  nominal: number;
  denda?: number;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Belum: "warning",
  Lunas: "success",
  Tunggakan: "danger",
};

function formatRupiah(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function JadwalDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const docQuery = useResourceDoc<JadwalDoc>(JADWAL_DOCTYPE, name);
  const payParams: ListParams = useMemo(
    () => ({
      fields: ["name", "jadwal", "akad", "tanggal_bayar", "metode", "nominal", "denda"],
      filters: [["jadwal", "=", name]],
      order_by: "`tanggal_bayar` desc",
      limit_page_length: 50,
    }),
    [name],
  );
  const payQuery = useResourceList<PembayaranRow>(PEMBAYARAN_DOCTYPE, payParams);
  const [payOpen, setPayOpen] = useState(false);

  const doc = docQuery.data;
  const pembayaran = payQuery.data ?? [];

  if (docQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat jadwal...</div>;
  }
  if (docQuery.isError || !doc) {
    return (
      <div className="py-16">
        <EmptyState
          title="Jadwal angsuran tidak ditemukan"
          description={(docQuery.error as Error | undefined)?.message ?? "Periksa ID jadwal atau kembali ke daftar."}
          action={
            <Link to="/koperasi/angsuran" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const status = doc.status ?? "Belum";
  const isLunas = status === "Lunas";

  const cols: Column<PembayaranRow>[] = [
    { key: "name", header: "ID Pembayaran", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: "tanggal_bayar", header: "Tanggal", cell: (r) => r.tanggal_bayar },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "nominal", header: "Nominal", align: "right",
      cell: (r) => <span className="tabular-nums">{formatRupiah(r.nominal)}</span> },
    { key: "denda", header: "Denda", align: "right",
      cell: (r) => <span className="tabular-nums">{r.denda !== undefined ? formatRupiah(r.denda) : "—"}</span> },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/koperasi" className={className}>{children}</Link> },
              { label: "Angsuran", render: ({ className, children }) => <Link to="/koperasi/angsuran" className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Jadwal Angsuran"
            title={doc.name}
            description={`Akad ${doc.akad ?? "—"} · angsuran ke ${doc.angsuran_ke ?? "—"} · ${status}`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate({ to: "/koperasi/angsuran" })}>
                  <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                  Kembali
                </Button>
                <Button onClick={() => setPayOpen(true)} disabled={isLunas}>
                  {isLunas ? "Sudah Lunas" : "Bayar"}
                </Button>
              </div>
            }
          />
        </div>
      }
      primary={
        <>
          <SectionCard title="Informasi Jadwal">
            <InfoGrid cols={2}>
              <InfoField label="ID Jadwal" value={<span className="font-mono">{doc.name}</span>} />
              <InfoField label="Akad" value={
                doc.akad ? (
                  <Link to="/koperasi/pembiayaan/$name" params={{ name: doc.akad }} className="font-mono text-brand hover:underline">
                    {doc.akad}
                  </Link>
                ) : "—"
              } />
              <InfoField label="Angsuran Ke" value={<span className="tabular-nums">{doc.angsuran_ke ?? "—"}</span>} />
              <InfoField label="Jatuh Tempo" value={doc.jatuh_tempo ?? "—"} />
              <InfoField label="Nominal" value={<span className="tabular-nums">{formatRupiah(doc.nominal)}</span>} />
              <InfoField label="Status" value={<Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>} />
              <InfoField label="Tanggal Bayar" value={doc.tanggal_bayar ?? "—"} />
            </InfoGrid>
          </SectionCard>
          <SectionCard
            title="Riwayat Pembayaran"
            description={`${pembayaran.length} transaksi`}
            padded={false}
          >
            <DataTable
              data={pembayaran}
              columns={cols}
              rowKey={(r) => r.name}
              empty={
                <div>
                  <div className="font-medium text-fg">
                    {payQuery.isLoading ? "Memuat..." : "Belum ada pembayaran"}
                  </div>
                  <div className="text-xs mt-1">Catat pembayaran via tombol Bayar.</div>
                </div>
              }
            />
          </SectionCard>
        </>
      }
      footer={
        <PembayaranAngsuranModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          jadwal={doc.name}
          {...(doc.akad ? { akad: doc.akad } : {})}
          {...(doc.nominal !== undefined ? { defaultNominal: doc.nominal } : {})}
        />
      }
    />
  );
}

export const Route = createFileRoute("/koperasi/angsuran/$name")({
  component: JadwalDetailPage,
});

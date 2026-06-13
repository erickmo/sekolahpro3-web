import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
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

// Jadwal Angsuran is a CHILD row of Akad Pembiayaan — its parent link lives
// in the standard `parent` field (field contract per jadwal_angsuran.json).
interface JadwalDoc {
  name: string;
  parent?: string;
  ke?: number;
  tanggal_jatuh_tempo?: string;
  pokok?: number;
  margin?: number;
  total?: number;
  status?: string;
}

interface PembayaranRow {
  name: string;
  akad_pembiayaan: string;
  angsuran_ke?: number;
  tanggal_bayar: string;
  jumlah_bayar: number;
  denda?: number;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Belum: "warning",
  Lunas: "success",
  Terlambat: "danger",
};

function formatRupiah(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function JadwalDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const docQuery = useResourceDoc<JadwalDoc>(JADWAL_DOCTYPE, name);
  const akadName = docQuery.data?.parent;
  const angsuranKe = docQuery.data?.ke;
  // Payments reference the parent akad + installment number — there is no
  // jadwal link field on Pembayaran Angsuran.
  const payParams: ListParams = useMemo(
    () => ({
      fields: ["name", "akad_pembiayaan", "angsuran_ke", "tanggal_bayar", "jumlah_bayar", "denda"],
      filters: [
        ["akad_pembiayaan", "=", akadName ?? ""],
        ["angsuran_ke", "=", angsuranKe ?? -1],
      ],
      order_by: "`tanggal_bayar` desc",
      limit_page_length: 50,
    }),
    [akadName, angsuranKe],
  );
  const payQuery = useResourceList<PembayaranRow>(PEMBAYARAN_DOCTYPE, payParams, {
    enabled: Boolean(akadName) && angsuranKe !== undefined,
  });
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
            <Link to="/kop/$sekolah/angsuran" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
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
    { key: "jumlah_bayar", header: "Nominal", align: "right",
      cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah_bayar)}</span> },
    { key: "denda", header: "Denda", align: "right",
      cell: (r) => <span className="tabular-nums">{r.denda ? formatRupiah(r.denda) : "—"}</span> },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Angsuran", render: ({ className, children }) => <Link to="/kop/$sekolah/angsuran" params={{ sekolah }} className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Jadwal Angsuran"
            title={doc.name}
            description={`Akad ${akadName ?? "—"} · angsuran ke ${doc.ke ?? "—"} · ${status}`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/angsuran", params: { sekolah } })}>
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
                akadName ? (
                  <Link to="/kop/$sekolah/pembiayaan/$name" params={{ sekolah, name: akadName }} className="font-mono text-brand hover:underline">
                    {akadName}
                  </Link>
                ) : "—"
              } />
              <InfoField label="Angsuran Ke" value={<span className="tabular-nums">{doc.ke ?? "—"}</span>} />
              <InfoField label="Jatuh Tempo" value={doc.tanggal_jatuh_tempo ?? "—"} />
              <InfoField label="Pokok" value={<span className="tabular-nums">{formatRupiah(doc.pokok)}</span>} />
              <InfoField label="Margin" value={<span className="tabular-nums">{formatRupiah(doc.margin)}</span>} />
              <InfoField label="Total Tagihan" value={<span className="tabular-nums">{formatRupiah(doc.total)}</span>} />
              <InfoField label="Status" value={<Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>} />
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
          {...(akadName ? { akad: akadName } : {})}
          {...(doc.ke !== undefined ? { angsuranKe: doc.ke } : {})}
          onSuccess={() => void payQuery.refetch()}
        />
      }
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/angsuran_/$name")({
  component: JadwalDetailPage,
});

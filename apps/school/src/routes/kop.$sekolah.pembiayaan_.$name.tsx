import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  IconCheck,
  IconWallet,
  type Column,
} from "@sekolahpro/ui";
import {
  humanizeFrappeError,
  useResourceDoc,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";

const AKAD_DOCTYPE = "Akad Pembiayaan";

// Field contract per backend akad_pembiayaan.json — jadwal_angsuran rides as
// child rows on the doc itself (no standalone child-table query needed).
interface JadwalRow {
  name: string;
  ke?: number;
  tanggal_jatuh_tempo?: string;
  pokok?: number;
  margin?: number;
  total?: number;
  status: string;
}

interface AkadDoc {
  name: string;
  nomor_akad?: string;
  nasabah?: string;
  produk_pembiayaan?: string;
  jumlah_pokok?: number;
  margin_total?: number;
  total_kewajiban?: number;
  tenor?: number;
  tanggal_akad?: string;
  tanggal_jatuh_tempo?: string;
  status?: string;
  kolektibilitas?: string;
  tunggakan_hari?: number;
  jadwal_angsuran?: JadwalRow[];
}

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "brand",
  Lunas: "success",
  Macet: "danger",
};

const JADWAL_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Belum: "warning",
  Lunas: "success",
  Terlambat: "danger",
};

function formatRupiah(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function AkadDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const docQuery = useResourceDoc<AkadDoc>(AKAD_DOCTYPE, name);
  const update = useResourceUpdate<AkadDoc>(AKAD_DOCTYPE);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<JadwalRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const doc = docQuery.data;
  const jadwal = useMemo(() => doc?.jadwal_angsuran ?? [], [doc]);

  const totals = useMemo(() => {
    const lunas = jadwal.filter((j) => j.status === "Lunas");
    const terlambat = jadwal.filter((j) => j.status === "Terlambat");
    const sisa = jadwal.filter((j) => j.status !== "Lunas").reduce((a, j) => a + (j.total ?? 0), 0);
    return { lunas: lunas.length, terlambat: terlambat.length, sisa, total: jadwal.length };
  }, [jadwal]);

  const runStatus = async (next: string, label: string) => {
    setActionError(null);
    try {
      await update.mutateAsync({ name, patch: { status: next } });
      await qc.invalidateQueries({ queryKey: ["resource:doc", AKAD_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", AKAD_DOCTYPE] });
    } catch (err) {
      setActionError(humanizeFrappeError(err) ?? (err instanceof Error ? err.message : `Gagal ${label}`));
    }
  };

  if (docQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat akad...</div>;
  }
  if (docQuery.isError || !doc) {
    return (
      <div className="py-16">
        <EmptyState
          title="Akad tidak ditemukan"
          description={(docQuery.error as Error | undefined)?.message ?? "Periksa nomor akad atau kembali ke daftar."}
          action={
            <Link to="/kop/$sekolah/pembiayaan" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  // Backend lifecycle: Aktif → Lunas / Macet (no Pengajuan/Disetujui stage —
  // akad tercipta langsung Aktif; persetujuan pembiayaan terjadi sebelum input).
  const status = doc.status ?? "Aktif";
  const canMacet = status === "Aktif";
  const canLunas = status === "Aktif" || status === "Macet";

  const cols: Column<JadwalRow>[] = [
    { key: "ke", header: "#", align: "right", sortable: true,
      cell: (r) => <span className="tabular-nums">{r.ke}</span> },
    { key: "tanggal_jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.tanggal_jatuh_tempo ?? "—" },
    { key: "total", header: "Nominal", align: "right",
      cell: (r) => <span className="tabular-nums">{formatRupiah(r.total)}</span> },
    { key: "status", header: "Status",
      cell: (r) => <Badge tone={JADWAL_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
    { key: "aksi", header: "", cell: (r) => (
      r.status !== "Lunas" ? (
        <Button size="sm" variant="outline" onClick={() => { setPayTarget(r); setPayOpen(true); }}>
          Bayar
        </Button>
      ) : <span className="text-xs text-muted-fg">—</span>
    ) },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Pembiayaan", render: ({ className, children }) => <Link to="/kop/$sekolah/pembiayaan" params={{ sekolah }} className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Akad Pembiayaan"
            title={doc.name}
            description={`${doc.produk_pembiayaan ?? "—"} · ${doc.nasabah ?? "—"} · ${status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/pembiayaan", params: { sekolah } })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali
              </Button>
            }
          />
        </div>
      }
      hero={
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-emerald-500/5 p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-fg truncate">{doc.produk_pembiayaan ?? "Akad Pembiayaan"}</h2>
                <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>
                {doc.kolektibilitas ? <Badge tone="neutral">{doc.kolektibilitas}</Badge> : null}
              </div>
              <div className="mt-1 text-sm text-muted-fg">
                <span className="font-mono">{doc.name}</span>
                <span className="mx-2">·</span>
                <span>{doc.nasabah ?? "—"}</span>
                <span className="mx-2">·</span>
                <span>Tgl Akad {doc.tanggal_akad ?? "—"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
                <span>Pokok <span className="font-medium text-fg tabular-nums">{formatRupiah(doc.jumlah_pokok)}</span></span>
                <span>Margin <span className="font-medium text-fg tabular-nums">{formatRupiah(doc.margin_total)}</span></span>
                <span>Tenor <span className="font-medium text-fg tabular-nums">{doc.tenor ?? 0} bln</span></span>
                {doc.tunggakan_hari ? (
                  <span>Tunggakan <span className="font-medium text-rose-600 tabular-nums">{doc.tunggakan_hari} hari</span></span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!canMacet || update.isPending} onClick={() => runStatus("Macet", "menandai macet")}>
                Tandai Macet
              </Button>
              <Button size="sm" variant="outline" disabled={!canLunas || update.isPending} onClick={() => runStatus("Lunas", "menutup")}>
                Tutup Lunas
              </Button>
            </div>
          </div>
          {actionError ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {actionError}
            </div>
          ) : null}
        </div>
      }
      stats={
        <>
          <StatCard label="Total Angsuran" value={totals.total} hint={`tenor ${doc.tenor ?? 0} bln`} icon={<IconWallet />} accent="brand" />
          <StatCard label="Lunas" value={totals.lunas} accent="emerald" icon={<IconCheck />} />
          <StatCard label="Terlambat" value={totals.terlambat} accent="rose" />
          <StatCard label="Sisa Outstanding" value={formatRupiah(totals.sisa)} accent="amber" />
        </>
      }
      primary={
        <SectionCard title="Jadwal Angsuran" description={`${jadwal.length} baris`} padded={false}>
          <DataTable
            data={jadwal}
            columns={cols}
            rowKey={(r) => r.name}
            empty={
              <div>
                <div className="font-medium text-fg">Belum ada jadwal angsuran</div>
                <div className="text-xs mt-1">
                  Jadwal tergenerate otomatis oleh backend saat akad dibuat.
                </div>
              </div>
            }
          />
        </SectionCard>
      }
      side={
        <SectionCard title="Informasi Akad">
          <InfoGrid cols={1}>
            <InfoField label="No. Akad" value={<span className="font-mono">{doc.nomor_akad ?? doc.name}</span>} />
            <InfoField label="Nasabah" value={doc.nasabah ?? "—"} />
            <InfoField label="Produk" value={doc.produk_pembiayaan ?? "—"} />
            <InfoField label="Pokok" value={<span className="tabular-nums">{formatRupiah(doc.jumlah_pokok)}</span>} />
            <InfoField label="Margin Total" value={<span className="tabular-nums">{formatRupiah(doc.margin_total)}</span>} />
            <InfoField label="Total Kewajiban" value={<span className="tabular-nums">{formatRupiah(doc.total_kewajiban)}</span>} />
            <InfoField label="Tenor" value={`${doc.tenor ?? 0} bulan`} />
            <InfoField label="Tanggal Akad" value={doc.tanggal_akad ?? "—"} />
            <InfoField label="Jatuh Tempo" value={doc.tanggal_jatuh_tempo ?? "—"} />
            <InfoField label="Kolektibilitas" value={doc.kolektibilitas ?? "—"} />
            <InfoField label="Status" value={<Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>} />
          </InfoGrid>
        </SectionCard>
      }
      footer={
        <PembayaranAngsuranModal
          open={payOpen}
          onClose={() => { setPayOpen(false); setPayTarget(null); }}
          akad={doc.name}
          {...(payTarget?.ke !== undefined ? { angsuranKe: payTarget.ke } : {})}
          onSuccess={() => void qc.invalidateQueries({ queryKey: ["resource:doc", AKAD_DOCTYPE] })}
        />
      }
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/pembiayaan_/$name")({
  component: AkadDetailPage,
});

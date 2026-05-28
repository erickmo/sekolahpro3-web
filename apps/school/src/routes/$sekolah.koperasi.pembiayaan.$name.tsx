import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
  type ListParams,
} from "@sekolahpro/api-client";
import { PembayaranAngsuranModal } from "../components/koperasi-pembiayaan/pembayaranForm";

const AKAD_DOCTYPE = "Akad Pembiayaan";
const JADWAL_DOCTYPE = "Jadwal Angsuran";

interface AkadDoc {
  name: string;
  anggota?: string;
  produk?: string;
  akad?: string;
  pokok_pembiayaan?: number;
  margin?: number;
  tenor_bulan?: number;
  jaminan?: string;
  status?: string;
  tanggal_akad?: string;
  catatan?: string;
}

interface JadwalRow {
  name: string;
  ke?: number;
  total?: number;
  status: string;
  // legacy fields kept optional for cells
  akad?: string;
  angsuran_ke?: number;
  jatuh_tempo?: string;
  nominal?: number;
  tanggal_bayar?: string;
}

const STATUS_TONE: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Pengajuan: "neutral",
  Disetujui: "brand",
  Berjalan: "brand",
  Lunas: "success",
  Macet: "danger",
  Batal: "neutral",
};

const JADWAL_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Belum: "warning",
  Lunas: "success",
  Tunggakan: "danger",
};

function formatRupiah(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function AkadDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const docQuery = useResourceDoc<AkadDoc>(AKAD_DOCTYPE, name);
  const jadwalParams: ListParams = useMemo(
    () => ({
      fields: ["name", "ke", "total", "status"],
      order_by: "`ke` asc",
      limit_page_length: 200,
    }),
    [name],
  );
  const jadwalQuery = useResourceList<JadwalRow>(JADWAL_DOCTYPE, jadwalParams);
  const update = useResourceUpdate<AkadDoc>(AKAD_DOCTYPE);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<JadwalRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const doc = docQuery.data;
  const jadwal = jadwalQuery.data ?? [];

  const totals = useMemo(() => {
    const lunas = jadwal.filter((j) => j.status === "Lunas");
    const tunggakan = jadwal.filter((j) => j.status === "Tunggakan");
    const sisa = jadwal.filter((j) => j.status !== "Lunas").reduce((a, j) => a + (j.total ?? 0), 0);
    return { lunas: lunas.length, tunggakan: tunggakan.length, sisa, total: jadwal.length };
  }, [jadwal]);

  const runStatus = async (next: string, label: string) => {
    setActionError(null);
    try {
      await update.mutateAsync({ name, patch: { status: next } });
      await qc.invalidateQueries({ queryKey: ["resource:doc", AKAD_DOCTYPE, name] });
      await qc.invalidateQueries({ queryKey: ["resource:list", AKAD_DOCTYPE] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Gagal ${label}`);
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
            <Link to="/koperasi/pembiayaan" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const status = doc.status ?? "Pengajuan";
  const canSetuju = status === "Pengajuan";
  const canCair = status === "Disetujui";
  const canMacet = status === "Berjalan";
  const canLunas = status === "Berjalan" || status === "Macet";

  const cols: Column<JadwalRow>[] = [
    { key: "angsuran_ke", header: "#", align: "right", sortable: true,
      cell: (r) => <span className="tabular-nums">{r.angsuran_ke}</span> },
    { key: "name", header: "ID Jadwal", cell: (r) => (
      <Link to="/koperasi/angsuran/$name" params={{ name: r.name }} className="font-mono text-xs text-brand hover:underline">
        {r.name}
      </Link>
    ) },
    { key: "jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.jatuh_tempo },
    { key: "nominal", header: "Nominal", align: "right",
      cell: (r) => <span className="tabular-nums">{formatRupiah(r.nominal)}</span> },
    { key: "status", header: "Status",
      cell: (r) => <Badge tone={JADWAL_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
    { key: "tanggal_bayar", header: "Tgl Bayar", cell: (r) => r.tanggal_bayar ?? "—" },
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
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/koperasi" className={className}>{children}</Link> },
              { label: "Pembiayaan", render: ({ className, children }) => <Link to="/koperasi/pembiayaan" className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Akad Pembiayaan"
            title={doc.name}
            description={`${doc.akad ?? "—"} · ${doc.anggota ?? "—"} · ${status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/koperasi/pembiayaan" })}>
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
                <h2 className="text-2xl font-bold text-fg truncate">{doc.produk ?? "Akad Pembiayaan"}</h2>
                <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>
                <Badge tone="neutral">{doc.akad ?? "—"}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-fg">
                <span className="font-mono">{doc.name}</span>
                <span className="mx-2">·</span>
                <span>{doc.anggota ?? "—"}</span>
                <span className="mx-2">·</span>
                <span>Tgl Akad {doc.tanggal_akad ?? "—"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
                <span>Pokok <span className="font-medium text-fg tabular-nums">{formatRupiah(doc.pokok_pembiayaan)}</span></span>
                <span>Margin <span className="font-medium text-fg tabular-nums">{formatRupiah(doc.margin)}</span></span>
                <span>Tenor <span className="font-medium text-fg tabular-nums">{doc.tenor_bulan ?? 0} bln</span></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!canSetuju || update.isPending} onClick={() => runStatus("Disetujui", "menyetujui")}>
                Setujui
              </Button>
              <Button size="sm" variant="outline" disabled={!canCair || update.isPending} onClick={() => runStatus("Berjalan", "mencairkan")}>
                Cairkan
              </Button>
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
          <StatCard label="Total Angsuran" value={totals.total} hint={`tenor ${doc.tenor_bulan ?? 0} bln`} icon={<IconWallet />} accent="brand" />
          <StatCard label="Lunas" value={totals.lunas} accent="emerald" icon={<IconCheck />} />
          <StatCard label="Tunggakan" value={totals.tunggakan} accent="rose" />
          <StatCard label="Sisa Outstanding" value={formatRupiah(totals.sisa)} accent="amber" />
        </>
      }
      primary={
        <>
          <SectionCard title="Jadwal Angsuran" description={`${jadwal.length} baris`} padded={false}>
            <DataTable
              data={jadwal}
              columns={cols}
              rowKey={(r) => r.name}
              empty={
                <div>
                  <div className="font-medium text-fg">
                    {jadwalQuery.isLoading ? "Memuat..." : "Belum ada jadwal angsuran"}
                  </div>
                  <div className="text-xs mt-1">
                    Jadwal akan tergenerate setelah akad disetujui & dicairkan.
                  </div>
                </div>
              }
            />
          </SectionCard>
          {doc.catatan ? (
            <SectionCard title="Catatan">
              <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{doc.catatan}</p>
            </SectionCard>
          ) : null}
        </>
      }
      side={
        <SectionCard title="Informasi Akad">
          <InfoGrid cols={1}>
            <InfoField label="No. Akad" value={<span className="font-mono">{doc.name}</span>} />
            <InfoField label="Anggota" value={doc.anggota ?? "—"} />
            <InfoField label="Produk" value={doc.produk ?? "—"} />
            <InfoField label="Akad" value={<Badge tone="neutral">{doc.akad ?? "—"}</Badge>} />
            <InfoField label="Pokok" value={<span className="tabular-nums">{formatRupiah(doc.pokok_pembiayaan)}</span>} />
            <InfoField label="Margin" value={<span className="tabular-nums">{formatRupiah(doc.margin)}</span>} />
            <InfoField label="Tenor" value={`${doc.tenor_bulan ?? 0} bulan`} />
            <InfoField label="Jaminan" value={doc.jaminan ?? "—"} />
            <InfoField label="Tanggal Akad" value={doc.tanggal_akad ?? "—"} />
            <InfoField label="Status" value={<Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{status}</Badge>} />
          </InfoGrid>
        </SectionCard>
      }
      footer={
        <PembayaranAngsuranModal
          open={payOpen}
          onClose={() => { setPayOpen(false); setPayTarget(null); }}
          {...(payTarget ? { jadwal: payTarget.name } : {})}
          akad={doc.name}
          {...(payTarget ? { defaultNominal: payTarget.nominal } : {})}
        />
      }
    />
  );
}

export const Route = createFileRoute("/koperasi/pembiayaan/$name")({
  component: AkadDetailPage,
});

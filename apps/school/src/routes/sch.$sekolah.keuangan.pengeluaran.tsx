/**
 * Operasional › Pengeluaran (school expenses).
 *
 * Bendahara record operational spending with an approval status. Adds a role
 * guide, expense-by-category donut, and approval KPIs. Mock-backed.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  type Column,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  StatCard,
  type SelectFilter,
  IconCheck,
  IconClock,
  IconAlert,
  IconWallet,
} from "@sekolahpro/ui";
import { DonutChart, type ChartDatum, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  listPengeluaranForSekolah,
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type PengeluaranRow,
  type StatusPengeluaran,
  type KategoriPengeluaran,
} from "../data/keuangan";

const TONE_PENGELUARAN: Record<StatusPengeluaran, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Disetujui: "success",
  Approval: "warning",
  Ditolak: "danger",
  Dibayar: "brand",
  Draft: "neutral",
};

const KATEGORI_TONE: Record<KategoriPengeluaran, Tone> = {
  Operasional: "brand",
  Gaji: "violet",
  "Sarana Prasarana": "sky",
  Kegiatan: "amber",
  ATK: "emerald",
  Utilitas: "rose",
  Lainnya: "neutral",
};

const GUIDE_STEPS = [
  { title: "Ajukan pengeluaran", detail: "Isi kategori, deskripsi, jumlah, dan penerima. Status awal 'Draft' lalu 'Menunggu Approval'.", roles: ["bendahara"] },
  { title: "Persetujuan", detail: "Pengeluaran besar menunggu persetujuan Kepala Sekolah sebelum dibayar.", roles: ["kepala", "bendahara"] },
  { title: "Pembayaran & posting", detail: "Setelah 'Dibayar', transaksi mengalir ke jurnal di Akuntansi › Buku Besar.", roles: ["akuntan", "bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

function PengeluaranPage() {
  const { sekolah } = Route.useParams();
  const [kategori, setKategori] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [metode, setMetode] = useState("Semua");
  const [search, setSearch] = useState("");

  const scoped = useMemo(() => listPengeluaranForSekolah(sekolah), [sekolah]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((p) => {
      if (q && !`${p.deskripsi} ${p.penerima} ${p.id}`.toLowerCase().includes(q)) return false;
      if (kategori !== "Semua" && p.kategori !== kategori) return false;
      if (status !== "Semua" && p.status !== status) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      return true;
    });
  }, [scoped, search, kategori, status, metode]);

  const counts = useMemo(() => {
    const c = { Disetujui: 0, Approval: 0, Ditolak: 0, Dibayar: 0 } as Record<string, number>;
    filtered.forEach((p) => {
      if (p.status in c) c[p.status] = (c[p.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const donut = useMemo<ChartDatum[]>(() => {
    const totals = new Map<KategoriPengeluaran, number>();
    for (const p of filtered) totals.set(p.kategori, (totals.get(p.kategori) ?? 0) + p.jumlah);
    return [...totals.entries()]
      .map(([k, value]) => ({ label: k, value, tone: KATEGORI_TONE[k] }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totalBelanja = useMemo(() => filtered.reduce((s, p) => s + p.jumlah, 0), [filtered]);

  const filters: SelectFilter[] = [
    { key: "kategori", label: "Kategori", value: kategori, options: buildOptions(FILTER_OPTIONS.kategoriPengeluaran), onChange: setKategori },
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusPengeluaran), onChange: setStatus },
    { key: "metode", label: "Metode", value: metode, options: buildOptions(FILTER_OPTIONS.metode), onChange: setMetode },
  ];

  const cols: Column<PengeluaranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "kategori", header: "Kategori", cell: (r) => <Badge tone="brand">{r.kategori}</Badge> },
    { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-sm">{r.deskripsi}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => <span className="text-sm">{r.penerima}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_PENGELUARAN[r.status]} dot>{r.status}</Badge> },
    { key: "approver", header: "Approver", cell: (r) => <span className="text-sm text-muted-fg">{r.approver ?? "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Pengeluaran"
        description="Catat belanja operasional sekolah dan alur persetujuannya."
      />

      <KeuanganPageGuide storageId="pengeluaran" steps={GUIDE_STEPS} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Disetujui" value={counts.Disetujui ?? 0} accent="emerald" icon={<IconCheck />} />
          <StatCard label="Menunggu Approval" value={counts.Approval ?? 0} accent="amber" icon={<IconClock />} />
          <StatCard label="Ditolak" value={counts.Ditolak ?? 0} accent="rose" icon={<IconAlert />} />
          <StatCard label="Dibayar" value={counts.Dibayar ?? 0} accent="brand" icon={<IconWallet />} />
        </div>
        <SectionCard title="Belanja per Kategori" description={formatRupiah(totalBelanja)}>
          <div className="flex justify-center">
            <DonutChart data={donut} centerTop={<span className="text-sm font-semibold">{donut.length}</span>} centerBottom={<span className="text-[11px] text-muted-fg">kategori</span>} />
          </div>
        </SectionCard>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari deskripsi, penerima, atau ID..." }}
        filters={filters}
      />

      <SectionCard title={`${filtered.length} pengeluaran`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/pengeluaran")({ component: PengeluaranPage });

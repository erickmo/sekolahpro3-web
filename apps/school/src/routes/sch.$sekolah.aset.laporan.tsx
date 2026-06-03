import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatCard, Badge, IconLayers, IconCheck, IconClock, IconSettings } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { ASET_PAGE_GUIDES } from "../components/aset/pageGuides";
import { computeAsetStats, countByStatus, type AsetRow, type PeminjamanRow } from "../lib/aset/stats";
import { peminjamanStatusTone } from "../lib/aset/badges";
import { ROLE_LABEL } from "../lib/aset/role";

const ASET_FIELDS = ["name", "kategori", "kondisi", "status", "jumlah_total", "jumlah_tersedia"];
const PINJAM_FIELDS = ["name", "status"];

/** Render a labelled distribution row with a proportional bar. */
function DistRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-40 shrink-0"><Badge tone={tone} dot>{label}</Badge></div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-brand/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right text-sm tabular-nums">{value} <span className="text-muted-fg">({pct}%)</span></div>
    </div>
  );
}

function LaporanPage() {
  const asetQ = useResourceList<AsetRow>("Aset", { fields: ASET_FIELDS, limit_page_length: 0 });
  const pinjamQ = useResourceList<PeminjamanRow>("Permintaan Peminjaman Aset", { fields: PINJAM_FIELDS, limit_page_length: 0 });

  const asets = useMemo(() => asetQ.data ?? [], [asetQ.data]);
  const peminjaman = useMemo(() => pinjamQ.data ?? [], [pinjamQ.data]);
  const stats = useMemo(() => computeAsetStats(asets), [asets]);

  const kondisiDist = useMemo(() => {
    const out: Record<string, number> = { Baik: 0, "Rusak Ringan": 0, "Rusak Berat": 0 };
    for (const a of asets) if (a.kondisi) out[a.kondisi] = (out[a.kondisi] ?? 0) + 1;
    return out;
  }, [asets]);

  const pinjamDist = useMemo(() => countByStatus(peminjaman), [peminjaman]);
  const totalAset = stats.totalAset;
  const totalPinjam = peminjaman.length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Manajemen Aset" title="Laporan Aset" description="Rekap inventaris dan sirkulasi aset." />

      <PageGuide
        storageId="aset-laporan"
        storageNamespace="aset-guide:"
        title={ASET_PAGE_GUIDES.laporan.title}
        intro={ASET_PAGE_GUIDES.laporan.intro}
        steps={ASET_PAGE_GUIDES.laporan.steps}
        tips={ASET_PAGE_GUIDES.laporan.tips}
        roleLabels={ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Aset" value={stats.totalAset} hint={`${stats.totalUnit} unit`} icon={<IconLayers />} accent="brand" urgency="normal" />
        <StatCard label="Unit Tersedia" value={stats.unitTersedia} hint={`dari ${stats.totalUnit}`} icon={<IconCheck />} accent="emerald" urgency="normal" />
        <StatCard label="Unit Dipinjam" value={stats.unitDipinjam} hint={`utilisasi ${stats.utilisasiPct}%`} icon={<IconClock />} accent="amber" urgency="normal" />
        <StatCard label="Aset Maintenance" value={stats.asetMaintenance} hint={`${stats.asetRusak} rusak`} icon={<IconSettings />} accent={stats.asetMaintenance > 0 ? "rose" : "emerald"} urgency="normal" />
      </div>

      <SectionCard title="Distribusi Kondisi Aset" description="Sebaran kondisi seluruh aset.">
        {asetQ.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat...</div>
        ) : (
          <div>
            <DistRow label="Baik" value={kondisiDist["Baik"] ?? 0} total={totalAset} tone="success" />
            <DistRow label="Rusak Ringan" value={kondisiDist["Rusak Ringan"] ?? 0} total={totalAset} tone="warning" />
            <DistRow label="Rusak Berat" value={kondisiDist["Rusak Berat"] ?? 0} total={totalAset} tone="danger" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Distribusi Status Peminjaman" description="Sebaran status seluruh permintaan peminjaman.">
        {pinjamQ.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat...</div>
        ) : totalPinjam === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada peminjaman.</div>
        ) : (
          <div>
            {Object.entries(pinjamDist).map(([status, count]) => (
              <DistRow key={status} label={status} value={count} total={totalPinjam} tone={peminjamanStatusTone(status)} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/laporan")({ component: LaporanPage });

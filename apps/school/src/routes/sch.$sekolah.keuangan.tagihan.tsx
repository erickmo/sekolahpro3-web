/**
 * Operasional › Tagihan (student billing).
 *
 * Bendahara/Kasir issue & track SPP and other student bills. Adds a role-aware
 * guide, a status distribution bar, and KPI counters over the table.
 * Wired to the live `School Fee Invoice` doctype (vernon_accounting) via
 * useTagihanLive, scoped to the active company.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  type Column,
  DataTable,
  FilterBar,
  PageHeader,
  SectionCard,
  StatCard,
  type SelectFilter,
  IconWallet,
  IconCheck,
  IconAlert,
  IconClock,
  IconPlus,
} from "@sekolahpro/ui";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type TagihanRow,
  type StatusTagihan,
} from "../data/keuangan";
import { useTagihanLive } from "../data/keuangan-live";

const TONE_TAGIHAN: Record<StatusTagihan, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Lunas: "success",
  Tertunda: "warning",
  "Jatuh Tempo": "danger",
  Cicilan: "brand",
  Draft: "neutral",
  Terkirim: "brand",
  Dibatalkan: "neutral",
};

const GUIDE_STEPS = [
  { title: "Terbitkan tagihan", detail: "Klik 'Buat Tagihan' untuk SPP atau biaya lain. Tagihan terkirim ke wali murid.", roles: ["bendahara"] },
  { title: "Pantau status", detail: "Gunakan filter status untuk melihat yang Jatuh Tempo atau Tertunda lebih dulu.", roles: ["bendahara", "kasir"] },
  { title: "Tindak lanjut tunggakan", detail: "Sisa terbesar perlu diprioritaskan. Hubungi wali murid untuk pelunasan.", roles: ["kepala", "bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

function TagihanPage() {
  const [status, setStatus] = useState("Semua");
  const [search, setSearch] = useState("");

  const { rows: scoped, isLoading } = useTagihanLive();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((t) => {
      if (q && !`${t.siswa} ${t.judul} ${t.id}`.toLowerCase().includes(q)) return false;
      if (status !== "Semua" && t.status !== status) return false;
      return true;
    });
  }, [scoped, search, status]);

  const counts = useMemo(() => {
    const c = { Lunas: 0, Tertunda: 0, "Jatuh Tempo": 0, Cicilan: 0 } as Record<string, number>;
    filtered.forEach((t) => {
      if (t.status in c) c[t.status] = (c[t.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const distribution = useMemo<DistributionSegment[]>(
    () => [
      { label: "Lunas", value: counts.Lunas ?? 0, tone: "emerald" },
      { label: "Tertunda", value: counts.Tertunda ?? 0, tone: "amber" },
      { label: "Jatuh Tempo", value: counts["Jatuh Tempo"] ?? 0, tone: "rose" },
      { label: "Cicilan", value: counts.Cicilan ?? 0, tone: "brand" },
    ],
    [counts],
  );

  const filters: SelectFilter[] = [
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusTagihan), onChange: setStatus },
  ];

  const cols: Column<TagihanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    {
      key: "siswa",
      header: "Siswa",
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{r.siswa}</div>
          <div className="text-xs text-muted-fg">{r.kelas}</div>
        </div>
      ),
    },
    { key: "judul", header: "Judul", cell: (r) => <span className="text-sm">{r.judul}</span> },
    { key: "jt", header: "Jatuh Tempo", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.jatuhTempo)}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "dibayar", header: "Dibayar", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.dibayar)}</span> },
    {
      key: "sisa",
      header: "Sisa",
      align: "right",
      cell: (r) => {
        const sisa = r.jumlah - r.dibayar;
        return <span className={`tabular-nums font-medium ${sisa > 0 ? "text-amber-700" : "text-emerald-600"}`}>{formatRupiah(sisa)}</span>;
      },
    },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_TAGIHAN[r.status]} dot>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Tagihan Siswa"
        description="Terbitkan dan pantau SPP serta biaya siswa."
        actions={
          <Button>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Buat Tagihan
          </Button>
        }
      />

      <KeuanganPageGuide storageId="tagihan" steps={GUIDE_STEPS} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lunas" value={counts.Lunas ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Tertunda" value={counts.Tertunda ?? 0} accent="amber" icon={<IconClock />} />
        <StatCard label="Jatuh Tempo" value={counts["Jatuh Tempo"] ?? 0} accent="rose" icon={<IconAlert />} />
        <StatCard label="Cicilan" value={counts.Cicilan ?? 0} accent="brand" icon={<IconWallet />} />
      </div>

      <SectionCard title="Distribusi Status" description="Komposisi tagihan terfilter">
        <DistributionBar segments={distribution} showLegend />
      </SectionCard>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, atau ID tagihan..." }}
        filters={filters}
      />

      <SectionCard title={isLoading ? "Memuat tagihan…" : `${filtered.length} tagihan`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/tagihan")({ component: TagihanPage });

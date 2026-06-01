/**
 * berandaPanel — panel view bodies untuk Beranda PPDB.
 *
 * Dipakai HANYA oleh route sch.$sekolah.ppdb.index. Diekstrak agar file route
 * tetap di bawah batas 300 baris dan tiap fungsi ringkas (< 40 baris).
 *
 * Dua view utama:
 *  - RingkasanView: KPI + visualisasi (funnel, trend, donut, distribusi, gauge)
 *    plus blok "Perlu Perhatian" yang dipertahankan dari versi lama.
 *  - AntrianKerjaView: kartu grup antrian kerja + NextActionCard.
 *
 * Semua data turunan dihitung di lib (ppdbAnalytics/ppdbQueue); panel ini murni
 * presentasi (renderLink disuntik agar bebas-router).
 */

import type { ReactNode } from "react";
import {
  AttentionList,
  type AttentionItem,
  Badge,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconWallet,
  IconCalendar,
} from "@sekolahpro/ui";
import {
  DonutChart,
  DistributionBar,
  FunnelChart,
  GaugeArc,
  TrendArea,
} from "../viz";
import { NextActionCard, type NextAction } from "./NextActionCard";
import type { WorkQueueGroup } from "../../lib/ppdbQueue";

/** Callback injeksi tautan agar panel tidak terikat router tertentu. */
export type RenderLink = (href: string, children: ReactNode) => ReactNode;

/** Ringkasan KPI agregat untuk baris StatCard. */
export interface BerandaKpi {
  total: number;
  lolos: number;
  pembayaranPending: number;
  hariTersisa: number;
}

/** Bundel data visualisasi yang sudah dihitung di lapisan lib. */
export interface BerandaViz {
  funnel: { label: string; value: number; tone?: ChartTone }[];
  trendPoints: number[];
  trendLabels: string[];
  jalur: { label: string; value: number; tone?: ChartTone }[];
  paymentDist: { label: string; value: number; tone: ChartTone }[];
  quotaFilled: number;
  quotaTotal: number;
}

// Re-derive chart tone type tanpa import siklik berat dari charts.
type ChartTone = "brand" | "emerald" | "amber" | "rose" | "violet" | "sky" | "neutral";

// String UI terpusat (no magic strings).
const KPI_TOTAL_LABEL = "Total Pendaftar";
const KPI_LOLOS_LABEL = "Lolos Seleksi";
const KPI_BAYAR_LABEL = "Pembayaran Pending";
const KPI_HARI_LABEL = "Hari Tersisa Gelombang";
const FUNNEL_TITLE = "Pipeline Pendaftaran";
const FUNNEL_DESC = "Distribusi pendaftar per tahap seleksi.";
const TREND_TITLE = "Tren Pendaftaran";
const TREND_DESC = "Jumlah pendaftar baru per hari.";
const JALUR_TITLE = "Komposisi Jalur";
const JALUR_DESC = "Sebaran pendaftar per jalur masuk.";
const PAYMENT_TITLE = "Status Pembayaran";
const PAYMENT_DESC = "Komposisi status tagihan PPDB.";
const QUOTA_TITLE = "Pengisian Kuota";
const QUOTA_DESC = "Terisi vs kuota gelombang aktif.";
const ATTENTION_TITLE = "Perlu Perhatian";
const ATTENTION_DESC = "Sinyal lintas modul untuk tim PPDB.";
const LOCALE = "id-ID";

/** Baris empat KPI utama Beranda PPDB. */
function KpiRow({ kpi, renderLink }: { kpi: BerandaKpi; renderLink: RenderLink }): ReactNode {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={KPI_TOTAL_LABEL} value={kpi.total.toLocaleString(LOCALE)} hint="seluruh pendaftaran" icon={<IconUsers />} accent="brand" actionHref="/sch/$sekolah/ppdb/calon-siswa" renderLink={renderLink} />
      <StatCard label={KPI_LOLOS_LABEL} value={kpi.lolos.toLocaleString(LOCALE)} hint="lulus + diterima" icon={<IconCheck />} accent="emerald" actionHref="/sch/$sekolah/ppdb/seleksi" renderLink={renderLink} />
      <StatCard label={KPI_BAYAR_LABEL} value={kpi.pembayaranPending.toLocaleString(LOCALE)} hint="tagihan tertunda" icon={<IconWallet />} accent="rose" urgency={kpi.pembayaranPending > 0 ? "warn" : "normal"} actionHref="/sch/$sekolah/ppdb/pembayaran" renderLink={renderLink} />
      <StatCard label={KPI_HARI_LABEL} value={kpi.hariTersisa.toLocaleString(LOCALE)} hint="menuju penutupan" icon={<IconCalendar />} accent="violet" urgency={kpi.hariTersisa <= 14 ? "warn" : "normal"} actionHref="/sch/$sekolah/ppdb/gelombang" renderLink={renderLink} />
    </div>
  );
}

/** Grid dua kolom berisi funnel + tren pendaftaran. */
function PipelineAndTrend({ viz }: { viz: BerandaViz }): ReactNode {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title={FUNNEL_TITLE} description={FUNNEL_DESC}>
        <FunnelChart stages={viz.funnel} />
      </SectionCard>
      <SectionCard title={TREND_TITLE} description={TREND_DESC}>
        <TrendArea points={viz.trendPoints} labels={viz.trendLabels} />
      </SectionCard>
    </div>
  );
}

/** Grid tiga kolom: jalur (donut), pembayaran (distribusi), kuota (gauge). */
function CompositionRow({ viz }: { viz: BerandaViz }): ReactNode {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title={JALUR_TITLE} description={JALUR_DESC}>
        <DonutChart data={viz.jalur} />
      </SectionCard>
      <SectionCard title={PAYMENT_TITLE} description={PAYMENT_DESC}>
        <DistributionBar segments={viz.paymentDist} />
      </SectionCard>
      <SectionCard title={QUOTA_TITLE} description={QUOTA_DESC}>
        <GaugeArc value={viz.quotaFilled} max={viz.quotaTotal} tone="brand" />
      </SectionCard>
    </div>
  );
}

export interface RingkasanViewProps {
  kpi: BerandaKpi;
  viz: BerandaViz;
  attention: AttentionItem[];
  renderLink: RenderLink;
}

/** View "Ringkasan" — orientasi manajer: KPI + visualisasi + perhatian. */
export function RingkasanView({ kpi, viz, attention, renderLink }: RingkasanViewProps): ReactNode {
  return (
    <div className="space-y-4">
      <KpiRow kpi={kpi} renderLink={renderLink} />
      <PipelineAndTrend viz={viz} />
      <CompositionRow viz={viz} />
      <SectionCard title={ATTENTION_TITLE} description={ATTENTION_DESC}>
        <AttentionList items={attention} renderLink={renderLink} />
      </SectionCard>
    </div>
  );
}

// Aksen kiri kartu antrian per tone — token tema, bukan warna mentah.
const QUEUE_ACCENT: Record<WorkQueueGroup["tone"], string> = {
  brand: "border-l-brand",
  warning: "border-l-amber-500",
  danger: "border-l-danger",
  success: "border-l-emerald-500",
  neutral: "border-l-border",
};

// Tone Badge mengikuti vocab @sekolahpro/ui.
const QUEUE_BADGE: Record<WorkQueueGroup["tone"], "brand" | "warning" | "danger" | "success" | "neutral"> = {
  brand: "brand",
  warning: "warning",
  danger: "danger",
  success: "success",
  neutral: "neutral",
};

const QUEUE_EMPTY_PREVIEW = "Tidak ada pekerjaan tertunda.";

/** Satu kartu grup antrian kerja: badge count + preview + deep link. */
function QueueCard({ group, renderLink }: { group: WorkQueueGroup; renderLink: RenderLink }): ReactNode {
  return (
    <SectionCard padded={false} className={`border-l-4 ${QUEUE_ACCENT[group.tone]}`}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-fg">{group.label}</h3>
          <Badge tone={QUEUE_BADGE[group.tone]}>{group.count.toLocaleString(LOCALE)}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-fg">{group.description}</p>
        <ul className="mt-3 space-y-1.5">
          {group.items.length === 0 ? (
            <li className="text-xs text-muted-fg">{QUEUE_EMPTY_PREVIEW}</li>
          ) : (
            group.items.map((it) => (
              <li key={it.noPendaftaran} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-fg">{it.namaLengkap}</span>
                <span className="shrink-0 text-muted-fg">{it.detail}</span>
              </li>
            ))
          )}
        </ul>
        {/* Deep link ke route modul terkait; param diisi pemanggil via renderLink. */}
        <div className="mt-4">{renderLink(group.actionHref, <span className="text-xs font-medium text-brand hover:underline">Buka modul →</span>)}</div>
      </div>
    </SectionCard>
  );
}

export interface AntrianKerjaViewProps {
  groups: WorkQueueGroup[];
  nextAction: NextAction | null;
  renderLink: RenderLink;
}

/** View "Antrian Kerja" — orientasi staff: NextAction + grid grup antrian. */
export function AntrianKerjaView({ groups, nextAction, renderLink }: AntrianKerjaViewProps): ReactNode {
  return (
    <div className="space-y-4">
      <NextActionCard action={nextAction} renderLink={renderLink} />
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <QueueCard key={group.id} group={group} renderLink={renderLink} />
        ))}
      </div>
    </div>
  );
}

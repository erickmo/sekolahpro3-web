/**
 * Role-adaptive Pengaturan health dashboard — the settings hub centrepiece.
 *
 * A PURE VIEW: it receives the aggregate state, the resolved presentation role,
 * and live Modul/Feature-Flag rows as props, then renders KPIs, an onboarding
 * checklist, a visualization grid, role-framed quick links, and a recent-change
 * log. It calls NO hook and fetches NO data — the parent route owns all of
 * that. Built so a brand-new staff member can orient in seconds.
 *
 * Code/doc comments are English; every UI string is Bahasa Indonesia.
 */
import type { ReactNode } from "react";
import type { PengaturanState, PengaturanTabKey } from "../../data/pengaturan";
import type { PengaturanRoleInfo } from "../../lib/pengaturanRole";
import {
  integrationStats,
  integrationDonut,
  securityScore,
  roleDistribution,
  notificationSegments,
  planUsage,
  setupCompleteness,
  moduleStats,
  flagStats,
  type SecurityScore,
} from "../../lib/pengaturanSummary";
import { DonutChart, HBarChart, DistributionBar, ProgressRing } from "../viz/charts";
import { GaugeChart } from "../viz/finance-charts";
import {
  StatCard,
  SectionCard,
  IconCheck,
  IconWallet,
  IconSettings,
} from "@sekolahpro/ui";
import {
  RingkasanOnboarding,
  RingkasanQuickLinks,
  RingkasanLog,
  SecurityFactorList,
} from "./RingkasanView.parts";

const FULL_PCT = 100;

/** Props for the pure {@link RingkasanView}. */
export interface RingkasanViewProps {
  state: PengaturanState;
  role: PengaturanRoleInfo;
  /** Live Modul Aktif rows (may be empty when the doctype is unavailable). */
  modul: { aktif?: number }[];
  /** Live Feature Flag rows (may be empty when the doctype is unavailable). */
  flag: { enabled?: number }[];
  /** Jump to a configuration tab. */
  onOpenTab: (tab: PengaturanTabKey) => void;
}

/** Map a security grade to a StatCard accent (emerald → amber → rose). */
function gradeAccent(grade: SecurityScore["grade"]): "emerald" | "amber" | "rose" {
  if (grade === "A" || grade === "B") return "emerald";
  if (grade === "C") return "amber";
  return "rose";
}

/**
 * KPI row: setup completeness, integration health, security grade, plan usage.
 *
 * @param state the aggregate settings state.
 * @returns four StatCards in a responsive grid.
 */
function RingkasanKpis({ state }: { state: PengaturanState }): ReactNode {
  const setup = setupCompleteness(state);
  const integ = integrationStats(state.integrasi);
  const sec = securityScore(state.keamanan);
  const usage = planUsage(state.billing, state.usage);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Kelengkapan Setup"
        value={`${setup.pct}%`}
        icon={<IconSettings />}
        accent="brand"
        urgency={setup.pct < FULL_PCT ? "warn" : "normal"}
        hint={`${setup.done}/${setup.total} langkah selesai`}
      />
      <StatCard
        label="Integrasi Terhubung"
        value={`${integ.terhubung}/${integ.total}`}
        icon={<IconCheck />}
        accent="emerald"
        urgency={integ.error > 0 ? "critical" : "normal"}
        hint={integ.error > 0 ? `${integ.error} perlu perhatian` : "Semua sehat"}
      />
      <StatCard
        label="Skor Keamanan"
        value={sec.grade}
        icon={<IconSettings />}
        accent={gradeAccent(sec.grade)}
        hint={`Skor ${sec.score}/100`}
      />
      <StatCard
        label="Pemakaian Paket"
        value={`${usage.siswa.pct}%`}
        icon={<IconWallet />}
        accent="violet"
        hint={`${usage.siswa.used} siswa`}
      />
    </div>
  );
}

/**
 * Visualization grid: gauges, donuts and bars summarising every settings area.
 *
 * @param state the aggregate settings state.
 * @param modul live module rows for the adoption donut.
 * @param flag live feature-flag rows for the on/off distribution.
 * @returns a responsive grid of SectionCard-wrapped charts.
 */
function RingkasanViz({
  state,
  modul,
  flag,
}: {
  state: PengaturanState;
  modul: { aktif?: number }[];
  flag: { enabled?: number }[];
}): ReactNode {
  const setup = setupCompleteness(state);
  const integ = integrationStats(state.integrasi);
  const sec = securityScore(state.keamanan);
  const usage = planUsage(state.billing, state.usage);
  const mod = moduleStats(modul);
  const flg = flagStats(flag);
  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <SectionCard title="Kelengkapan Setup" description="Persentase langkah setup yang sudah dituntaskan.">
        <GaugeChart value={setup.pct} ariaLabel={`Kelengkapan setup ${setup.pct} persen`} label={`${setup.done}/${setup.total} langkah`} />
      </SectionCard>
      <SectionCard title="Status Integrasi" description="Sebaran koneksi layanan pihak ketiga.">
        <DonutChart data={integrationDonut(state.integrasi)} centerTop={integ.terhubung} centerBottom="Terhubung" />
      </SectionCard>
      <SectionCard title="Skor Keamanan" description="Penilaian kebijakan keamanan terhadap 5 faktor.">
        <GaugeChart value={sec.score} tone={sec.score >= 75 ? "emerald" : sec.score >= 50 ? "amber" : "rose"} ariaLabel={`Skor keamanan ${sec.score} dari 100`} label={`Grade ${sec.grade}`} />
        <SecurityFactorList security={sec} />
      </SectionCard>
      <SectionCard title="Distribusi Pengguna per Peran" description="Jumlah pengguna pada tiap peran.">
        <HBarChart data={roleDistribution(state.peran)} />
      </SectionCard>
      <SectionCard title="Pemakaian Paket" description="Pemakaian kuota siswa, pegawai, dan penyimpanan.">
        <div className="flex flex-wrap items-start justify-around gap-4">
          <ProgressRing value={usage.siswa.pct} label="Siswa" tone="brand" />
          <ProgressRing value={usage.pegawai.pct} label="Pegawai" tone="emerald" />
          <ProgressRing value={usage.storage.pct} label="Penyimpanan" tone="violet" />
        </div>
      </SectionCard>
      <SectionCard title="Cakupan Notifikasi" description="Jumlah kategori aktif per kanal notifikasi.">
        <DistributionBar segments={notificationSegments(state.notifikasi)} />
      </SectionCard>
      <SectionCard title="Adopsi Modul" description="Modul aktif vs nonaktif.">
        <DonutChart
          data={[
            { label: "Aktif", value: mod.aktif, tone: "emerald" },
            { label: "Nonaktif", value: Math.max(0, mod.total - mod.aktif), tone: "neutral" },
          ]}
          centerTop={`${mod.pct}%`}
          centerBottom="Aktif"
        />
      </SectionCard>
      <SectionCard title="Feature Flag" description="Flag yang dihidupkan vs dimatikan.">
        <DistributionBar
          segments={[
            { label: "Aktif", value: flg.aktif, tone: "brand" },
            { label: "Nonaktif", value: Math.max(0, flg.total - flg.aktif), tone: "neutral" },
          ]}
        />
      </SectionCard>
    </div>
  );
}

/**
 * The role-adaptive Pengaturan health dashboard.
 *
 * @param props the {@link RingkasanViewProps}.
 * @returns the full ringkasan dashboard tree.
 */
export function RingkasanView(props: RingkasanViewProps): ReactNode {
  const { state, role, modul, flag, onOpenTab } = props;
  const setup = setupCompleteness(state);
  return (
    <div className="space-y-6">
      <RingkasanKpis state={state} />
      <RingkasanOnboarding setup={setup} onOpenTab={onOpenTab} />
      <RingkasanViz state={state} modul={modul} flag={flag} />
      <RingkasanQuickLinks role={role} onOpenTab={onOpenTab} />
      <RingkasanLog log={state.log} />
    </div>
  );
}

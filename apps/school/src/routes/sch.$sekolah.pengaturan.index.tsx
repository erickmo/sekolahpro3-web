/**
 * Pengaturan (settings) hub — slim composition route.
 *
 * Owns the aggregate PengaturanState, the save-flash, the active-tab state, and
 * the live Modul/Feature-Flag rows for the Ringkasan dashboard. All rendering is
 * delegated to the extracted pure panels + RingkasanView; this file only wires
 * them together (state, setters, flash) and adds the Ringkasan tab + PageGuide.
 *
 * UI strings are Bahasa Indonesia; code/doc comments are English (house rule).
 */
import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import {
  PageHeader,
  Tabs,
  Button,
  type TabItem,
  IconSettings,
  IconChart,
  IconDownload,
  IconId,
  IconCalendar,
  IconUsers,
  IconBell,
  IconWallet,
  IconFile,
  IconAlert,
  IconClock,
} from "@sekolahpro/ui";
import { usePengaturanRole, pengaturanRoleLabel } from "../lib/pengaturanRole";
import {
  defaultPengaturanState,
  INITIAL_NOTIFIKASI,
  type PengaturanState,
  type PengaturanTabKey,
} from "../data/pengaturan";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import { useFlash } from "../components/pengaturan/pengaturanShared";
import { RingkasanView } from "../components/pengaturan/RingkasanView";
import { SekolahPanel } from "../components/pengaturan/SekolahPanel";
import { AkademikPanel } from "../components/pengaturan/AkademikPanel";
import { PeranPanel } from "../components/pengaturan/PeranPanel";
import { IntegrasiPanel } from "../components/pengaturan/IntegrasiPanel";
import { NotifikasiPanel } from "../components/pengaturan/NotifikasiPanel";
import { KeamananPanel } from "../components/pengaturan/KeamananPanel";
import { BillingPanel } from "../components/pengaturan/BillingPanel";
import { BrandingPanel } from "../components/pengaturan/BrandingPanel";
import { LogPanel } from "../components/pengaturan/LogPanel";

/** Live Modul Aktif row shape consumed by the Ringkasan adoption donut. */
type ModulRow = { name: string; aktif?: number };
/** Live Feature Flag row shape consumed by the Ringkasan on/off distribution. */
type FlagRow = { name: string; enabled?: number };

/** Upper bound for the live master-data lists feeding the dashboard. */
const LIST_LIMIT = 200;

/** Tab metadata: Ringkasan first, then the nine configuration tabs. */
const TAB_META: { key: PengaturanTabKey; label: string; icon: ReactNode }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <IconChart /> },
  { key: "sekolah", label: "Sekolah", icon: <IconId /> },
  { key: "akademik", label: "Akademik", icon: <IconCalendar /> },
  { key: "peran", label: "Peran", icon: <IconUsers /> },
  { key: "integrasi", label: "Integrasi", icon: <IconSettings /> },
  { key: "notifikasi", label: "Notifikasi", icon: <IconBell /> },
  { key: "keamanan", label: "Keamanan", icon: <IconAlert /> },
  { key: "billing", label: "Billing", icon: <IconWallet /> },
  { key: "branding", label: "Branding", icon: <IconFile /> },
  { key: "log", label: "Log Konfigurasi", icon: <IconClock /> },
];

/** Onboarding steps for the Ringkasan PageGuide (several role-scoped). */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Mulai dari tab Ringkasan",
    detail:
      "Ringkasan menampilkan kelengkapan setup, kesehatan integrasi, skor keamanan, dan pemakaian paket dalam satu layar.",
  },
  {
    title: "Atur profil & akademik sekolah",
    detail: "Identitas, alamat, tahun ajaran, skala nilai, dan jam operasional ada di tab Sekolah dan Akademik.",
    roles: ["tu"],
  },
  {
    title: "Kelola langganan & pemakaian paket",
    detail: "Pantau batas siswa/pegawai/penyimpanan dan ubah paket di tab Billing.",
    roles: ["bendahara"],
  },
  {
    title: "Hubungkan & pantau integrasi",
    detail: "Sambungkan Dapodik, payment gateway, dan layanan lain di tab Integrasi.",
    roles: ["it"],
  },
  {
    title: "Perketat keamanan & audit",
    detail: "Atur kebijakan password, 2FA, retensi audit, dan tinjau log perubahan di tab Keamanan dan Log.",
    roles: ["kepala", "auditor"],
  },
  {
    title: "Perubahan tersimpan otomatis",
    detail:
      'Setiap edit langsung disimpan dengan tanda "Tersimpan". Modul Aktif dan Feature Flag dikelola di tab/halaman tersendiri.',
  },
];

/** Intro line shown above the Ringkasan PageGuide steps. */
const GUIDE_INTRO =
  "Pusat konfigurasi sekolah. Setiap pemangku kepentingan mengatur area-nya masing-masing; ikuti panduan di bawah.";

/**
 * Build a plain per-slice state updater (no flashing).
 *
 * The panels own their own save-flash via the `flash` prop (some flash per item,
 * e.g. integrasi-<nama>), so the setter must only patch state — mirroring the
 * old god-file where each setX was a plain useState setter.
 *
 * @param setState the PengaturanState setter.
 * @returns a function that patches one state slice.
 */
function makeSliceSetter(setState: (updater: (prev: PengaturanState) => PengaturanState) => void) {
  return <K extends keyof PengaturanState>(key: K, value: PengaturanState[K]): void => {
    setState((prev) => ({ ...prev, [key]: value }));
  };
}

/**
 * Trigger a browser download of the current config as a timestamped JSON file.
 *
 * @param state the aggregate settings state to serialise (usage excluded).
 */
function exportConfig(state: PengaturanState): void {
  const { usage: _usage, ...payload } = state;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pengaturan-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build the Tabs items, wiring each button to {@link setTab}. */
function buildTabItems(tab: PengaturanTabKey, setTab: (k: PengaturanTabKey) => void): TabItem[] {
  return TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setTab(t.key)} className={className}>
        {children}
      </button>
    ),
  }));
}

/**
 * The Pengaturan settings hub page. Exported by name so tests can import it
 * without a RouterProvider.
 *
 * @returns the settings hub tree (header, guide, tabs, active panel).
 */
export function PengaturanPage(): ReactNode {
  const [state, setState] = useState<PengaturanState>(defaultPengaturanState);
  const [flashKey, flash] = useFlash();
  const [tab, setTab] = useState<PengaturanTabKey>("ringkasan");
  const role = usePengaturanRole();
  const setSlice = makeSliceSetter(setState);

  // Live master-data feeding only the Ringkasan dashboard donuts/bars.
  const modul = useResourceList<ModulRow>("Modul Aktif", { fields: ["name", "aktif"], limit_page_length: LIST_LIMIT });
  const flag = useResourceList<FlagRow>("Feature Flag", { fields: ["name", "enabled"], limit_page_length: LIST_LIMIT });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Profil sekolah, peran pengguna, integrasi, dan keamanan."
        actions={
          <Button variant="outline" onClick={() => exportConfig(state)}>
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>
            Ekspor Konfigurasi
          </Button>
        }
      />
      <PageGuide
        storageId="pengaturan-ringkasan"
        storageNamespace="pengaturan-guide:"
        roleLabel={pengaturanRoleLabel}
        intro={GUIDE_INTRO}
        steps={GUIDE_STEPS}
      />
      <Tabs items={buildTabItems(tab, setTab)} />
      {renderTab({ tab, state, role, flash, flashKey, setSlice, modul: modul.data ?? [], flag: flag.data ?? [], onOpenTab: setTab })}
    </div>
  );
}

/** Arguments passed to {@link renderTab}. */
interface RenderTabArgs {
  tab: PengaturanTabKey;
  state: PengaturanState;
  role: ReturnType<typeof usePengaturanRole>;
  /** Per-item save-flash trigger (used by panels for sub-section flashes). */
  flash: (k: string) => void;
  flashKey: string | null;
  setSlice: ReturnType<typeof makeSliceSetter>;
  modul: ModulRow[];
  flag: FlagRow[];
  onOpenTab: (tab: PengaturanTabKey) => void;
}

/**
 * Render the panel for the active tab, wiring each setter to the state slice.
 *
 * @param args the active tab plus shared state/handlers (see {@link RenderTabArgs}).
 * @returns the panel element for the active tab.
 */
function renderTab(args: RenderTabArgs): ReactNode {
  const { tab, state, role, flash, flashKey, setSlice, modul, flag, onOpenTab } = args;
  switch (tab) {
    case "ringkasan":
      return <RingkasanView state={state} role={role} modul={modul} flag={flag} onOpenTab={onOpenTab} />;
    case "sekolah":
      return (
        <SekolahPanel
          identitas={state.identitas} setIdentitas={(v) => setSlice("identitas", v)}
          alamat={state.alamat} setAlamat={(v) => setSlice("alamat", v)}
          domain={state.domain} setDomain={(v) => setSlice("domain", v)}
          flash={flash} flashKey={flashKey} canEditIdentitas={role.canEditIdentitas}
        />
      );
    case "akademik":
      return (
        <AkademikPanel
          tahun={state.tahun} setTahun={(v) => setSlice("tahun", v)}
          skala={state.skala} setSkala={(v) => setSlice("skala", v)}
          jam={state.jam} setJam={(v) => setSlice("jam", v)}
          flash={flash} flashKey={flashKey}
        />
      );
    case "peran":
      return <PeranPanel list={state.peran} setList={(v) => setSlice("peran", v)} flash={flash} flashKey={flashKey} />;
    case "integrasi":
      return <IntegrasiPanel list={state.integrasi} setList={(v) => setSlice("integrasi", v)} flash={flash} />;
    case "notifikasi":
      return (
        <NotifikasiPanel
          list={state.notifikasi} setList={(v) => setSlice("notifikasi", v)}
          reset={() => setSlice("notifikasi", INITIAL_NOTIFIKASI)}
          flash={flash} flashKey={flashKey}
        />
      );
    case "keamanan":
      return <KeamananPanel value={state.keamanan} setValue={(v) => setSlice("keamanan", v)} flash={flash} flashKey={flashKey} />;
    case "billing":
      return <BillingPanel value={state.billing} setValue={(v) => setSlice("billing", v)} flash={flash} flashKey={flashKey} usage={state.usage} />;
    case "branding":
      return <BrandingPanel value={state.branding} setValue={(v) => setSlice("branding", v)} flash={flash} flashKey={flashKey} />;
    case "log":
      return <LogPanel list={state.log} />;
  }
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan/")({ component: PengaturanPage });

/**
 * Notifikasi (notification preferences) configuration panel.
 *
 * Pure presentational panel extracted from the Pengaturan god-file
 * (NotifikasiTab), behavior preserved 1:1. Adds a "Cakupan Notifikasi"
 * DistributionBar (enabled channels) above the per-category toggle table.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import {
  Button,
  type Column,
  DataTable,
  SectionCard,
} from "@sekolahpro/ui";
import type { NotifikasiPref } from "../../data/pengaturan";
import { notificationCoverage, notificationSegments } from "../../lib/pengaturanSummary";
import { DistributionBar } from "../viz/charts";
import { CheckCell, SavedFlash } from "./pengaturanShared";

/** Flash key used by every save in this panel. */
const FLASH_KEY = "notifikasi";

/** Toggleable channel fields on a notification preference row. */
type ChannelField = keyof Omit<NotifikasiPref, "kategori">;

/** Props for {@link NotifikasiPanel} — identical to the original NotifikasiTab. */
export interface NotifikasiPanelProps {
  list: NotifikasiPref[];
  setList: (v: NotifikasiPref[]) => void;
  reset: () => void;
  flash: (k: string) => void;
  flashKey: string | null;
}

/**
 * Visualization header: a "Cakupan Notifikasi" card with a DistributionBar of
 * how many categories enable each channel.
 *
 * @param list the notification preferences.
 * @returns the SectionCard with the distribution bar.
 */
function CakupanHeader({ list }: { list: NotifikasiPref[] }) {
  const cov = notificationCoverage(list);
  return (
    <SectionCard title="Cakupan Notifikasi" description={`${cov.coveragePct}% saluran aktif di semua kategori`}>
      <DistributionBar segments={notificationSegments(list)} />
    </SectionCard>
  );
}

/**
 * Notification preferences panel: coverage header plus an editable per-category
 * channel matrix (Email / Push / SMS / In-App) with a reset-to-default action.
 *
 * @param list the notification preferences.
 * @param setList commit a new preference list.
 * @param reset restore the default preferences.
 * @param flash trigger a save-flash by key.
 * @param flashKey the currently flashing key.
 * @returns the panel element.
 */
export function NotifikasiPanel({ list, setList, reset, flash, flashKey }: NotifikasiPanelProps) {
  const toggle = (kategori: string, field: ChannelField) => {
    setList(list.map((r) => r.kategori === kategori ? { ...r, [field]: !r[field] } : r));
    flash(FLASH_KEY);
  };
  const cols: Column<NotifikasiPref>[] = [
    { key: "kategori", header: "Kategori", cell: (r) => <span className="font-medium">{r.kategori}</span> },
    { key: "email", header: "Email", align: "center", cell: (r) => <CheckCell value={r.email} onToggle={() => toggle(r.kategori, "email")} /> },
    { key: "push", header: "Push", align: "center", cell: (r) => <CheckCell value={r.push} onToggle={() => toggle(r.kategori, "push")} /> },
    { key: "sms", header: "SMS", align: "center", cell: (r) => <CheckCell value={r.sms} onToggle={() => toggle(r.kategori, "sms")} /> },
    { key: "inApp", header: "In-App", align: "center", cell: (r) => <CheckCell value={r.inApp} onToggle={() => toggle(r.kategori, "inApp")} /> },
  ];

  return (
    <div className="space-y-6">
      <CakupanHeader list={list} />
      <SectionCard
        title={<span>Preferensi Notifikasi<SavedFlash show={flashKey === FLASH_KEY} /></span>}
        description="Klik ikon untuk toggle saluran"
        action={<Button variant="outline" size="sm" onClick={() => { reset(); flash(FLASH_KEY); }}>Reset ke Default</Button>}
        padded={false}
      >
        <DataTable data={list} columns={cols} rowKey={(r) => r.kategori} />
      </SectionCard>
    </div>
  );
}

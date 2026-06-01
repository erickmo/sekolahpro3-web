/**
 * Integrasi (third-party integrations) configuration panel.
 *
 * Pure presentational panel extracted from the Pengaturan god-file (IntegrasiTab),
 * behavior preserved 1:1. Adds a header row with a DonutChart of integration
 * status plus three counters (Terhubung / Belum / Error) above the cards grid.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import {
  Badge,
  Button,
  SectionCard,
  StatCard,
  IconClock,
} from "@sekolahpro/ui";
import type { Integrasi } from "../../data/pengaturan";
import { STATUS_INTEGRASI_TONE } from "../../data/pengaturan";
import { integrationDonut, integrationStats } from "../../lib/pengaturanSummary";
import { DonutChart } from "../viz/charts";

/** Timestamp slice length (YYYY-MM-DD HH:mm) for sync display. */
const SYNC_TS_LEN = 16;

/** Props for {@link IntegrasiPanel} — identical to the original IntegrasiTab. */
export interface IntegrasiPanelProps {
  list: Integrasi[];
  setList: (v: Integrasi[]) => void;
  flash: (k: string) => void;
}

/**
 * Visualization header: a status DonutChart plus Terhubung/Belum/Error counters.
 *
 * @param list the integrations.
 * @returns the SectionCard header element.
 */
function StatusHeader({ list }: { list: Integrasi[] }) {
  const stats = integrationStats(list);
  return (
    <SectionCard title="Status Integrasi" description={`${stats.healthPct}% layanan terhubung`}>
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <DonutChart data={integrationDonut(list)} centerTop={stats.terhubung} centerBottom="terhubung" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Terhubung" value={stats.terhubung} accent="emerald" />
          <StatCard label="Belum" value={stats.belum} accent="brand" />
          <StatCard label="Error" value={stats.error} accent="rose" urgency={stats.error > 0 ? "critical" : "normal"} />
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Action buttons for one integration card, dependent on its connection status.
 *
 * @param status the current connection status.
 * @param onConnect connect / retry / resync handler.
 * @param onDisconnect disconnect handler.
 * @returns the buttons row.
 */
function IntegrasiActions({ status, onConnect, onDisconnect }: { status: Integrasi["status"]; onConnect: () => void; onDisconnect: () => void }) {
  if (status === "Terhubung") {
    return (
      <>
        <Button variant="outline" size="sm" onClick={onConnect}>Sinkron Ulang</Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect}>Putuskan</Button>
      </>
    );
  }
  if (status === "Error") {
    return (
      <>
        <Button size="sm" onClick={onConnect}>Coba Lagi</Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect}>Putuskan</Button>
      </>
    );
  }
  return <Button size="sm" onClick={onConnect}>Hubungkan</Button>;
}

/**
 * Single integration card: name, description, status badge, sync metadata and
 * status-dependent actions.
 *
 * @param item the integration.
 * @param onStatus handler to change the integration status.
 * @returns the card element.
 */
function IntegrasiCard({ item, onStatus }: { item: Integrasi; onStatus: (status: Integrasi["status"]) => void }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-fg">{item.nama}</div>
          <div className="text-xs text-muted-fg mt-0.5">{item.deskripsi}</div>
        </div>
        <Badge tone={STATUS_INTEGRASI_TONE[item.status]} dot>{item.status}</Badge>
      </div>
      {item.terakhirSinkron ? (
        <div className="text-xs text-muted-fg inline-flex items-center gap-1">
          <span className="h-3 w-3"><IconClock /></span>
          Terakhir sinkron: <span className="tabular-nums">{item.terakhirSinkron}</span>
        </div>
      ) : null}
      {item.versi ? <div className="text-xs text-muted-fg">Versi: {item.versi}</div> : null}
      <div className="flex gap-2 pt-1">
        <IntegrasiActions
          status={item.status}
          onConnect={() => onStatus("Terhubung")}
          onDisconnect={() => onStatus("Belum")}
        />
      </div>
    </div>
  );
}

/**
 * Integrations panel: status header (donut + counters) plus a responsive grid
 * of integration cards whose actions toggle connection status.
 *
 * @param list the integrations.
 * @param setList commit a new integration list.
 * @param flash trigger a save-flash by key.
 * @returns the panel element.
 */
export function IntegrasiPanel({ list, setList, flash }: IntegrasiPanelProps) {
  // WHY: connecting stamps a fresh sync time; other transitions keep the old one.
  const updateStatus = (nama: string, status: Integrasi["status"]) => {
    setList(list.map((i) => i.nama === nama ? {
      ...i,
      status,
      terakhirSinkron: status === "Terhubung" ? new Date().toISOString().slice(0, SYNC_TS_LEN).replace("T", " ") : i.terakhirSinkron,
    } : i));
    flash(`integrasi-${nama}`);
  };

  return (
    <div className="space-y-6">
      <StatusHeader list={list} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((i) => (
          <IntegrasiCard key={i.nama} item={i} onStatus={(status) => updateStatus(i.nama, status)} />
        ))}
      </div>
    </div>
  );
}

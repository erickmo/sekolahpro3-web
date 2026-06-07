/**
 * Per-persona panel registry for the Beranda dashboard.
 *
 * Pure config: maps each {@link BerandaRole} to the ordered list of content
 * panels it renders plus how its "Konteks" (KPI) strip behaves. This is the
 * single source of truth the route's <BerandaView> iterates, so role-scoping is
 * data-driven instead of hand-written `if (role === ...)` branches in the View.
 *
 * Subtraction is the discipline (grafted from the C1 design): a guru never sees
 * school-wide finance/charts, a kepala never sees a transactional worklist — so
 * a persona's panel list is deliberately short, not the union of everything.
 */
import type { BerandaRole } from "./berandaRole";

/** Content panels (the Konteks strip is handled separately via {@link KonteksMode}). */
export type PanelKey = "antrean" | "hari-saya" | "sinyal" | "tren" | "aksi-cepat";

/** Every valid content-panel key (used for validation). */
export const PANEL_KEYS: readonly PanelKey[] = [
  "antrean",
  "hari-saya",
  "sinyal",
  "tren",
  "aksi-cepat",
];

/** How the KPI "Konteks" strip is presented for a persona. */
export type KonteksMode = "expanded" | "collapsed" | "hidden";

/** A persona's dashboard layout: Konteks strip mode + ordered content panels. */
export interface BerandaLayout {
  konteks: KonteksMode;
  /** Render order, top to bottom. Always includes "antrean" (the hero). */
  panels: PanelKey[];
}

/**
 * The layout registry. Order of `panels` is the literal render order.
 *  - Oversight (kepala/bendahara): expanded KPI strip, charts kept.
 *  - tu_operator: KPI collapsed to a chip, worklist + quick actions.
 *  - guru/wali_kelas: KPI hidden, my-day teaching strip leads (mobile-first).
 */
export const BERANDA_LAYOUT: Record<BerandaRole, BerandaLayout> = {
  kepala_sekolah: { konteks: "expanded", panels: ["antrean", "sinyal", "hari-saya", "tren"] },
  tu_operator: { konteks: "collapsed", panels: ["antrean", "aksi-cepat", "hari-saya"] },
  guru: { konteks: "hidden", panels: ["hari-saya", "antrean"] },
  wali_kelas: { konteks: "hidden", panels: ["hari-saya", "antrean", "sinyal", "tren"] },
  bendahara: { konteks: "expanded", panels: ["antrean", "hari-saya", "tren"] },
};

/** Persona used when a derived role is somehow unknown (defensive fallback). */
const FALLBACK_ROLE: BerandaRole = "tu_operator";

/** Resolve a persona's layout, falling back to the generic worklist layout. */
export function getBerandaLayout(role: BerandaRole): BerandaLayout {
  return BERANDA_LAYOUT[role] ?? BERANDA_LAYOUT[FALLBACK_ROLE];
}

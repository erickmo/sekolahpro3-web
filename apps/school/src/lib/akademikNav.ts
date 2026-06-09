// akademikNav — pure navigation/visibility helpers for the Akademik module.
//
// Extracted from the route layout so these stay testable and decoupled from the
// TanStack route-file restructure (TA hub + per-TA workspace). No React, no I/O.
import { type DistributionSegment } from "../components/viz";
import { isPastPeriod, type TahunAjaranRow } from "./akademikPeriode";

// Editor grid (entri-nilai/edit) manages its own period via the route params,
// so the shared period chrome (context bar + intro) is hidden there.
const PERIODE_SELF_MANAGED = "/akademik/entri-nilai/edit";

// Operational pages whose data is period-filtered; only here does the workspace
// inject the period guide + "Sebaran Tahun Ajaran" overview above the Outlet.
// The dashboard has its own guide + viz, so it is intentionally excluded.
const PERIODE_INTRO_PREFIXES = ["/akademik/asesmen", "/akademik/entri-nilai", "/akademik/raport"];

// Workspace feature sub-paths under a Tahun Ajaran (besides the dashboard index).
export const WORKSPACE_SUBPATHS = ["asesmen", "entri-nilai", "raport"] as const;

/** True only on the grid editor route, which self-manages its period. */
export function isPeriodeSelfManaged(pathname: string): boolean {
  return pathname.includes(PERIODE_SELF_MANAGED);
}

/**
 * Whether the period context bar shows for a path. Bar appears on EVERY Akademik
 * page (mirroring ekstrakurikuler) except the self-managed grid editor. The
 * "/akademik" guard keeps the function accurate if called with an unrelated path.
 */
export function showContextBar(pathname: string): boolean {
  if (!pathname.includes("/akademik")) return false;
  return !isPeriodeSelfManaged(pathname);
}

/**
 * Whether to inject the period guide + "Sebaran Tahun Ajaran" overview. Scoped to
 * operational pages (asesmen/entri-nilai/raport); excluded on dashboard + editor.
 */
export function showPeriodeIntro(pathname: string): boolean {
  if (isPeriodeSelfManaged(pathname)) return false;
  return PERIODE_INTRO_PREFIXES.some((p) => pathname.includes(p));
}

/**
 * Encode a Tahun Ajaran `name` (autoname `format:{sekolah}-{nama}`, where `nama`
 * may contain "/") into a URL-safe path segment for the `$ta` route param.
 */
export function taPath(name: string): string {
  return encodeURIComponent(name);
}

/** Active sub-page label for the workspace breadcrumb, derived from pathname. */
export function workspaceSubLabel(pathname: string): string {
  if (pathname.includes("/entri-nilai/edit")) return "Editor Entri Nilai";
  if (pathname.includes("/asesmen")) return "Input Nilai Test";
  if (pathname.includes("/entri-nilai")) return "Entri Nilai";
  if (pathname.includes("/raport")) return "Raport";
  return "Dashboard";
}

/**
 * Split a Tahun Ajaran list into the running ones (`is_current`) and the archive
 * (everything else), for the hub's two sections.
 */
export function splitTaList<T extends { is_current?: number }>(
  list: readonly T[],
): { berjalan: T[]; arsip: T[] } {
  const berjalan: T[] = [];
  const arsip: T[] = [];
  for (const t of list) {
    if (t.is_current) berjalan.push(t);
    else arsip.push(t);
  }
  return { berjalan, arsip };
}

/**
 * Pick the TA to auto-redirect into from the hub.
 *
 * Honours the remembered TA only while it is still a WRITABLE (non-past) period.
 * If the stored TA has since closed or fallen out of its date window, never drop
 * the user back into that archive — auto-landing on a read-only year shows
 * disabled save buttons that beginners read as "app broken" (debate critic
 * must-fix #3). Instead fall to the running (`is_current`) TA, or `null` to keep
 * the hub as the entry when nothing safe is available. First visit (no stored TA)
 * still returns `null` so the hub stays the deliberate entry point.
 */
export function pickAutoRedirectTa(
  storedTa: string | undefined,
  list: readonly TahunAjaranRow[],
  refDate: Date,
): string | null {
  if (!storedTa) return null;
  const stored = list.find((t) => t.name === storedTa);
  if (!stored) return null;
  if (!isPastPeriod(stored, refDate)) return storedTa;
  const current = list.find((t) => t.is_current === 1);
  return current ? current.name : null;
}

// Subset of TA fields needed for the distribution summary (structural so it does
// not depend on the exact TahunAjaranRow shape from lib akademikPeriode).
type TaStatusRow = { is_current?: number; status?: string };

/**
 * Summarise a Tahun Ajaran list into distribution segments (Berjalan / Aktif /
 * Ditutup) for DistributionBar. Uses only the already-fetched taList.
 */
export function buildTaSegments(taList: TaStatusRow[]): DistributionSegment[] {
  let berjalan = 0;
  let aktif = 0;
  let ditutup = 0;
  for (const t of taList) {
    if (t.is_current) berjalan += 1;
    else if (t.status && t.status !== "Aktif") ditutup += 1;
    else aktif += 1;
  }
  return [
    { label: "Berjalan", value: berjalan, tone: "emerald" },
    { label: "Aktif", value: aktif, tone: "sky" },
    { label: "Ditutup/Lampau", value: ditutup, tone: "amber" },
  ];
}

// akademikNav — pure navigation/visibility helpers for the Akademik module.
//
// Extracted from the route layout so these stay testable and decoupled from the
// TanStack route-file restructure (TA hub + per-TA workspace). No React, no I/O.
// Fase 1 additions: workspace nav groups, go-param validator, submodule-path
// detector, and next-TA picker (single-door spec §1.2–§1.5).
import { type DistributionSegment } from "../components/viz";
import { type NavTabGroup } from "../components/GroupedNavTabs";
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

// ── Fase 1: single-door additions ────────────────────────────────────────────

/** Module roots that live inside the per-TA workspace (spec §1.2).
 * These are the only values accepted as a `?go=` redirect target. */
export const WORKSPACE_MODULE_ROOTS = ["kelas", "jadwal", "ekskul"] as const;
export type WorkspaceModuleRoot = (typeof WORKSPACE_MODULE_ROOTS)[number];

/**
 * Validate a `?go=` redirect target coming from a legacy-URL stub.
 *
 * Whitelist by module root; reject anything that could escape the workspace
 * (absolute URL, empty/dot segments, encoded traversal). Returns the cleaned
 * subpath or null.
 *
 * @param go - Raw query-param value; may be undefined or empty.
 * @returns The validated DECODED subpath string, or null if invalid.
 */
export function parseGoParam(go: string | undefined): string | null {
  if (!go || go.startsWith("/") || go.includes("://")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(go);
  } catch {
    return null;
  }
  const segments = decoded.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || /[?#\\]/.test(s))) return null;
  return (WORKSPACE_MODULE_ROOTS as readonly string[]).includes(segments[0] ?? "") ? decoded : null;
}

/**
 * True when the pathname is inside a sub-module under the TA workspace —
 * the workspace layout then skips its own chrome (spec §1.7).
 *
 * Matches kelas / jadwal / ekskul segments only (penilaian pages stay inside
 * workspace chrome because they don't have their own layout shell).
 *
 * @param pathname - Current window.location.pathname.
 */
export function isSubmodulePath(pathname: string): boolean {
  return /\/akademik\/[^/]+\/(kelas|jadwal|ekskul)(\/|$)/.test(pathname);
}

/**
 * Nearest Tahun Ajaran starting strictly after the reference local date.
 *
 * Compares date STRINGS (YYYY-MM-DD) — never `new Date(...)` on date-only
 * values, which parse as UTC and skew +7h in Asia/Jakarta (same rule as
 * akademikPeriode). `refDateStr` must already be a local YYYY-MM-DD string.
 *
 * @param rows - TA list; each row must have `tanggal_mulai`.
 * @param refDateStr - Local date string (YYYY-MM-DD) to compare against.
 * @returns The nearest upcoming TA row, or null if none found.
 */
export function pickNextTa<T extends { tanggal_mulai?: string }>(
  rows: T[],
  refDateStr: string,
): T | null {
  const upcoming = rows
    .filter((r) => (r.tanggal_mulai ?? "") > refDateStr)
    .sort((a, b) => String(a.tanggal_mulai).localeCompare(String(b.tanggal_mulai)));
  return upcoming[0] ?? null;
}

/**
 * Workspace sub-nav groups for the pill bar inside the per-TA workspace layout.
 *
 * Groups:
 * - Ringkasan — workspace dashboard index (exact match).
 * - Pengaturan — annual-setup modules (kelas, jadwal, ekskul).
 * - Penilaian — assessment & report-card data entry.
 * - Kegiatan — operational/activity pages (agenda, ekskul sessions).
 *
 * Absensi/Laporan/PPDB carry no `$ta` segment and cannot join this bar;
 * they link from the workspace dashboard instead (plan Task 9).
 *
 * @returns Array of NavTabGroup ready to pass to GroupedNavTabs.
 */
export function buildWorkspaceNavGroups(): NavTabGroup[] {
  return [
    {
      label: "Ringkasan",
      items: [{ to: "/sch/$sekolah/akademik/$ta", label: "Dashboard", exact: true }],
    },
    {
      label: "Pengaturan",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/kelas", label: "Kelas & Rombel" },
        { to: "/sch/$sekolah/akademik/$ta/jadwal/papan", label: "Susun Jadwal" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/program", label: "Program Ekskul" },
      ],
    },
    {
      label: "Penilaian",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/asesmen", label: "Input Nilai Test" },
        { to: "/sch/$sekolah/akademik/$ta/entri-nilai", label: "Entri Nilai" },
        { to: "/sch/$sekolah/akademik/$ta/raport", label: "Raport" },
      ],
    },
    {
      label: "Kegiatan",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/jadwal/agenda", label: "Agenda Jadwal" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/pendaftaran", label: "Pendaftaran Ekskul" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/sesi", label: "Sesi Ekskul" },
      ],
    },
  ];
}

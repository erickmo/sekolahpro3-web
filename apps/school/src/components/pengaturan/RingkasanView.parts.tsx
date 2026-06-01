/**
 * Sub-components for the Pengaturan "Ringkasan" health dashboard.
 *
 * Kept in a sibling file so RingkasanView.tsx stays under the 300-line limit.
 * Every export here is a PURE presentational component: props in, JSX out, no
 * hooks, no data fetching. UI strings are Bahasa Indonesia; code/doc comments
 * are English per repo convention.
 */
import type { ReactNode } from "react";
import type { PengaturanState, PengaturanTabKey } from "../../data/pengaturan";
import type { PengaturanRoleInfo, PengaturanRole } from "../../lib/pengaturanRole";
import {
  type SecurityScore,
  type SetupCompleteness,
} from "../../lib/pengaturanSummary";
import {
  Badge,
  SectionCard,
  OnboardingChecklist,
  IconCheck,
  IconAlert,
} from "@sekolahpro/ui";

const LOG_LIMIT = 5;

/** Badge tone per coarse settings role (for the "Untuk Anda" highlight). */
const ROLE_BADGE_TONE = "brand" as const;

// --- Onboarding -------------------------------------------------------------

/**
 * Render the prominent setup checklist. Each step's href carries its target tab
 * key so {@link onOpenTab} can route the click without extra lookups.
 *
 * @param setup the computed setup completeness (items + done flags).
 * @param onOpenTab jump-to-tab callback fired when an open step is clicked.
 * @returns the onboarding checklist section (null once setup is 100%).
 */
export function RingkasanOnboarding({
  setup,
  onOpenTab,
}: {
  setup: SetupCompleteness;
  onOpenTab: (tab: PengaturanTabKey) => void;
}): ReactNode {
  // Encode the target tab in `href` (token, not a URL) so renderLink can route.
  const steps = setup.items.map((item, i) => ({
    id: `setup-${i}`,
    label: item.label,
    done: item.done,
    href: item.tab as string,
  }));
  return (
    <OnboardingChecklist
      title="Panduan setup sekolah"
      steps={steps}
      renderLink={(href, children) => (
        <button
          type="button"
          onClick={() => onOpenTab(href as PengaturanTabKey)}
          className="block w-full text-left"
        >
          {children}
        </button>
      )}
    />
  );
}

// --- Security factor list ---------------------------------------------------

/**
 * Compact list of security hardening factors, each marked pass/fail with a
 * green check or amber alert icon.
 *
 * @param security the computed security score + factor breakdown.
 * @returns an accessible list of factor rows.
 */
export function SecurityFactorList({ security }: { security: SecurityScore }): ReactNode {
  return (
    <ul className="mt-4 space-y-2">
      {security.factors.map((f) => (
        <li key={f.label} className="flex items-center gap-2 text-xs">
          {f.ok ? (
            <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <IconAlert className="h-4 w-4 shrink-0 text-amber-600" />
          )}
          <span className={f.ok ? "text-fg" : "text-muted-fg"}>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}

// --- Quick links ------------------------------------------------------------

/** A role-framed quick link: a config tab plus its Bahasa-Indonesia label. */
export interface QuickLink {
  tab: PengaturanTabKey;
  label: string;
}

/** Tabs emphasised per primary role (the "Untuk Anda" highlighted set). */
const ROLE_PRIMARY_TABS: Record<PengaturanRole, PengaturanTabKey[]> = {
  kepala: ["keamanan", "log", "billing"],
  tu: ["sekolah", "akademik"],
  bendahara: ["billing", "integrasi"],
  it: ["integrasi", "keamanan"],
  auditor: ["log", "keamanan"],
};

/** All quick links rendered, in display order, with their labels. */
const ALL_QUICK_LINKS: QuickLink[] = [
  { tab: "sekolah", label: "Profil Sekolah" },
  { tab: "akademik", label: "Akademik" },
  { tab: "peran", label: "Peran & Akses" },
  { tab: "integrasi", label: "Integrasi" },
  { tab: "notifikasi", label: "Notifikasi" },
  { tab: "keamanan", label: "Keamanan" },
  { tab: "billing", label: "Langganan" },
  { tab: "log", label: "Log Aktivitas" },
];

/** Resolve the set of tabs to highlight for the user's primary role. */
function primaryTabsFor(role: PengaturanRoleInfo): Set<PengaturanTabKey> {
  return new Set(ROLE_PRIMARY_TABS[role.primary]);
}

/**
 * Role-framed quick-link grid. Every link is always rendered; the ones relevant
 * to the user's primary role get a brand border and an "Untuk Anda" badge.
 *
 * @param role the resolved presentation role info.
 * @param onOpenTab jump-to-tab callback.
 * @returns the quick-links section.
 */
export function RingkasanQuickLinks({
  role,
  onOpenTab,
}: {
  role: PengaturanRoleInfo;
  onOpenTab: (tab: PengaturanTabKey) => void;
}): ReactNode {
  const highlighted = primaryTabsFor(role);
  return (
    <SectionCard title="Aksi cepat" description="Pintasan konfigurasi yang sering dipakai.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_QUICK_LINKS.map((link) => (
          <QuickLinkButton
            key={link.tab}
            link={link}
            primary={highlighted.has(link.tab)}
            onOpenTab={onOpenTab}
          />
        ))}
      </div>
    </SectionCard>
  );
}

/** One quick-link button; brand-bordered + badged when role-primary. */
function QuickLinkButton({
  link,
  primary,
  onOpenTab,
}: {
  link: QuickLink;
  primary: boolean;
  onOpenTab: (tab: PengaturanTabKey) => void;
}): ReactNode {
  const base =
    "flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50";
  const tone = primary ? "border-brand bg-brand/5 text-brand" : "border-border text-fg";
  return (
    <button type="button" onClick={() => onOpenTab(link.tab)} className={`${base} ${tone}`}>
      <span className="truncate">{link.label}</span>
      {primary ? (
        <Badge tone={ROLE_BADGE_TONE} className="shrink-0">
          Untuk Anda
        </Badge>
      ) : null}
    </button>
  );
}

// --- Recent changes log -----------------------------------------------------

/** Map a LogEntry tone to a Badge tone (identical enum, typed passthrough). */
function logBadgeTone(tone: PengaturanState["log"][number]["tone"]) {
  return tone;
}

/**
 * Compact list of the most recent configuration changes (top 5): actor, action
 * and timestamp, each tagged with a tone badge.
 *
 * @param log the full change log (newest-first ordering preserved).
 * @returns the "Perubahan Terbaru" section.
 */
export function RingkasanLog({ log }: { log: PengaturanState["log"] }): ReactNode {
  const recent = log.slice(0, LOG_LIMIT);
  return (
    <SectionCard title="Perubahan Terbaru" description="Aktivitas konfigurasi terakhir.">
      <ul className="divide-y divide-border">
        {recent.map((entry, i) => (
          <li key={`${entry.waktu}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-fg">
                <span className="font-medium">{entry.aktor}</span>{" "}
                <span className="text-muted-fg">{entry.aksi}</span>
              </p>
              <p className="text-xs tabular-nums text-muted-fg">{entry.waktu}</p>
            </div>
            <Badge tone={logBadgeTone(entry.tone)} className="shrink-0">
              {entry.tone}
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

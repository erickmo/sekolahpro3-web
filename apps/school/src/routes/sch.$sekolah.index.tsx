/**
 * Beranda — the role-adaptive dashboard landing.
 *
 * Thin route: derive the persona, run the live data hook, persist inbox dismissals
 * to localStorage, and hand fully-aggregated data to the pure <BerandaView>. All
 * number-crunching lives in lib/beranda/* + lib/beranda*.ts (see the tournament
 * plan). No early return before the hooks (keeps rules-of-hooks safe).
 */
import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { OnboardingChecklist } from "@sekolahpro/ui";
import { useOnboardingSteps } from "../data/onboarding";
import { BerandaView } from "../components/beranda/BerandaView";
import { useBerandaRole, useBerandaData, berandaTodayISO } from "../lib/beranda/scope";
import { getBerandaLayout, type BerandaLayout } from "../lib/berandaLayout";
import type { BerandaRole } from "../lib/berandaRole";

const ONBOARDING_DISMISS_KEY = "sekolahpro:onboarding-dismissed";
const INBOX_DISMISS_PREFIX = "sekolahpro:beranda-inbox-dismissed:";

/** Read a persisted string[] from localStorage, tolerant of SSR / bad JSON. */
function readDismissed(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Persist a string[] to localStorage (best-effort). */
function writeDismissed(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* storage unavailable — dismissal stays in-memory this session */
  }
}

function Home(): ReactNode {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const today = useMemo(() => berandaTodayISO(new Date()), []);
  const { roles, primary } = useBerandaRole();
  const [picked, setPicked] = useState<BerandaRole | null>(null);
  const active: BerandaRole = picked ?? primary;
  const data = useBerandaData(active, today);

  const dismissKey = INBOX_DISMISS_PREFIX + today;
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => readDismissed(dismissKey));
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(ONBOARDING_DISMISS_KEY) === "1",
  );
  const onboardingSteps = useOnboardingSteps();

  const handleDismiss = (id: string): void => {
    setDismissedIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      writeDismissed(dismissKey, next);
      return next;
    });
  };
  const handleDismissOnboarding = (): void => {
    setOnboardingDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(ONBOARDING_DISMISS_KEY, "1");
  };

  const renderLink = (href: string, children: ReactNode, className?: string): ReactNode => (
    <Link to={href.replace("$sekolah", sekolah)} params={{ sekolah }} className={className}>
      {children}
    </Link>
  );
  const layout: BerandaLayout = getBerandaLayout(active);

  return (
    <div className="space-y-6">
      {!onboardingDismissed ? (
        <OnboardingChecklist
          steps={onboardingSteps}
          onDismiss={handleDismissOnboarding}
          renderLink={(href, children) => (
            <Link to={href} params={{ sekolah }} className="block">
              {children}
            </Link>
          )}
        />
      ) : null}
      <BerandaView
        role={active}
        roles={roles}
        onRoleChange={setPicked}
        layout={layout}
        data={data}
        dismissedIds={dismissedIds}
        onDismiss={handleDismiss}
        renderLink={renderLink}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/")({ component: Home });

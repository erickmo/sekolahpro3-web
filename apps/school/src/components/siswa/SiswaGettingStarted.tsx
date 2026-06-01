import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GettingStartedCard, type GettingStartedAction } from "@sekolahpro/ui";

// Token used in href templates so callers can write the route shape once and let
// this component bind the active school (mirrors the staff dashboard pattern).
const SEKOLAH_TOKEN = "$sekolah";

interface SiswaGettingStartedProps {
  /** Active school slug used to resolve `$sekolah` in action hrefs. */
  sekolah: string;
  title: string;
  description?: string;
  steps?: string[];
  /** Required call-to-action; href may contain the `$sekolah` token. */
  primaryAction: GettingStartedAction;
  secondaryAction?: GettingStartedAction;
  icon?: ReactNode;
}

/**
 * Onboarding card for an empty Siswa list page. Wraps the shared
 * GettingStartedCard with a router-aware renderLink that resolves the
 * `$sekolah` token, so each route only supplies copy + a route-shaped href.
 * @param props sekolah + onboarding copy and actions
 */
export function SiswaGettingStarted({
  sekolah,
  title,
  description,
  steps,
  primaryAction,
  secondaryAction,
  icon,
}: SiswaGettingStartedProps) {
  const renderLink = (href: string, children: ReactNode, className?: string): ReactNode => (
    <Link to={href.replace(SEKOLAH_TOKEN, sekolah)} params={{ sekolah }} className={className}>
      {children}
    </Link>
  );

  return (
    <GettingStartedCard
      title={title}
      {...(description ? { description } : {})}
      {...(steps ? { steps } : {})}
      {...(icon ? { icon } : {})}
      primaryAction={primaryAction}
      {...(secondaryAction ? { secondaryAction } : {})}
      renderLink={renderLink}
    />
  );
}

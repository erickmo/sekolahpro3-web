/**
 * Unified Keuangan hub navigation.
 *
 * Renders the single hub nav (Ringkasan / Operasional / Akuntansi) used by both
 * the /keuangan and /akuntansi layouts so the two route trees feel like one
 * module. Adapts the IA in lib/keuanganHub.ts to the shared GroupedNavTabs.
 */
import type { ReactNode } from "react";
import { GroupedNavTabs, type NavTabGroup } from "../GroupedNavTabs";
import { KEUANGAN_HUB_GROUPS } from "../../lib/keuanganHub";

/** Flatten the hub IA into GroupedNavTabs groups (drops role/hint metadata). */
export function toNavTabGroups(): NavTabGroup[] {
  return KEUANGAN_HUB_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.map((i) => ({
      to: i.to,
      label: i.label,
      ...(i.exact ? { exact: i.exact } : {}),
    })),
  }));
}

export interface KeuanganHubNavProps {
  pathname: string;
  className?: string;
}

/** The hub nav pill bar. */
export function KeuanganHubNav({ pathname, className }: KeuanganHubNavProps): ReactNode {
  return (
    <div className={className}>
      <GroupedNavTabs groups={toNavTabGroups()} pathname={pathname} variant="inline" />
    </div>
  );
}

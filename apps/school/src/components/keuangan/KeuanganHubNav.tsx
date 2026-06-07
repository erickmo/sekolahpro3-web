/**
 * Unified Keuangan hub navigation — the "Alur Uang" money-flow pipeline.
 *
 * Renders the single hub nav (Beranda / Tagih / Terima / Catat / Tutup Buku /
 * Lapor Pajak) used by both the /keuangan and /akuntansi layouts so the two
 * route trees feel like one module. Adapts the IA in lib/keuanganHub.ts to the
 * shared GroupedNavTabs; the "Siapkan" setup drawer is intentionally excluded.
 */
import type { ReactNode } from "react";
import { GroupedNavTabs, type NavTabGroup } from "../GroupedNavTabs";
import { KEUANGAN_NAV_GROUPS } from "../../lib/keuanganHub";

/** The pipeline stages as GroupedNavTabs groups (setup drawer excluded). */
export function toNavTabGroups(): NavTabGroup[] {
  return KEUANGAN_NAV_GROUPS;
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

// pesanNav — role-filtered sub-navigation for the Pesan module.
//
// Mirrors lib/jadwalNav.ts: a pure module exporting role-annotated nav groups + a
// filter that drops items a role may not see, then drops empty groups. Role buckets
// come from lib/pesanRole (tu/guru/kepsek) so derivation lives in one place.
//
// Only routes that actually exist are listed here (typed Links would otherwise fail
// the build); persona phases add their tabs as their routes land.
import type { NavTabGroup } from "../components/GroupedNavTabs";
import type { PesanRole } from "./pesanRole";

/** A nav item annotated with the roles allowed to see it. Absent `roles` = all roles. */
interface PesanNavItem {
  to: string;
  label: string;
  exact?: boolean;
  roles?: readonly PesanRole[];
}

interface PesanNavGroup {
  label: string;
  items: readonly PesanNavItem[];
}

/** Full Pesan sub-nav, role-sliced per persona surface. */
export const PESAN_NAV_GROUPS: readonly PesanNavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/pesan", label: "Beranda", exact: true }],
  },
  {
    label: "Saya",
    items: [{ to: "/sch/$sekolah/pesan/saya", label: "Pesan Wali", roles: ["guru"] }],
  },
];

/**
 * Filter the Pesan nav for a role: drop items not granted to it, then drop any group
 * left empty. An item without an explicit `roles` list is shown to every role.
 */
export function filterPesanNav(
  role: PesanRole,
  groups: readonly PesanNavGroup[] = PESAN_NAV_GROUPS,
): NavTabGroup[] {
  const out: NavTabGroup[] = [];
  for (const group of groups) {
    const items = group.items
      .filter((it) => !it.roles || it.roles.includes(role))
      .map(({ roles: _roles, ...rest }) => rest);
    if (items.length > 0) {
      out.push({ label: group.label, items });
    }
  }
  return out;
}

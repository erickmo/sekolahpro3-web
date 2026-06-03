import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import type { NavTabGroup } from "../components/GroupedNavTabs";

/** Grouped sub-navigation for the Situs (school website CMS) module. */
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/situs", label: "Ringkasan", exact: true }],
  },
  {
    label: "Tampilan",
    items: [
      { to: "/sch/$sekolah/situs/tampilan", label: "Tampilan" },
      { to: "/sch/$sekolah/situs/tataletak", label: "Tata Letak" },
    ],
  },
  {
    label: "Konten",
    items: [
      { to: "/sch/$sekolah/situs/sorotan", label: "Sorotan" },
      { to: "/sch/$sekolah/situs/berita", label: "Berita" },
      { to: "/sch/$sekolah/situs/halaman", label: "Halaman" },
      { to: "/sch/$sekolah/situs/agenda", label: "Agenda" },
      { to: "/sch/$sekolah/situs/galeri", label: "Galeri" },
      { to: "/sch/$sekolah/situs/prestasi", label: "Prestasi" },
    ],
  },
  {
    label: "Pengaturan",
    items: [{ to: "/sch/$sekolah/situs/domain", label: "Domain" }],
  },
];

/** Situs module layout: config-only shell (no context bar) wrapping the route outlet. */
export function SitusLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/situs")({ component: SitusLayout });

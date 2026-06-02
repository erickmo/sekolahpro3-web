import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Tabs,
  type TabItem,
  IconHome,
  IconSettings,
  IconFile,
  IconBook,
  IconCalendar,
  IconLayers,
  IconFlag,
  IconMapPin,
} from "@sekolahpro/ui";

const TABS: { to: string; label: string; icon: ReactNode; exact?: boolean }[] = [
  { to: "/sch/$sekolah/situs", label: "Ringkasan", icon: <IconHome />, exact: true },
  { to: "/sch/$sekolah/situs/tampilan", label: "Tampilan", icon: <IconSettings /> },
  { to: "/sch/$sekolah/situs/tataletak", label: "Tata Letak", icon: <IconLayers /> },
  { to: "/sch/$sekolah/situs/sorotan", label: "Sorotan", icon: <IconFlag /> },
  { to: "/sch/$sekolah/situs/berita", label: "Berita", icon: <IconFile /> },
  { to: "/sch/$sekolah/situs/halaman", label: "Halaman", icon: <IconBook /> },
  { to: "/sch/$sekolah/situs/agenda", label: "Agenda", icon: <IconCalendar /> },
  { to: "/sch/$sekolah/situs/galeri", label: "Galeri", icon: <IconLayers /> },
  { to: "/sch/$sekolah/situs/prestasi", label: "Prestasi", icon: <IconFlag /> },
  { to: "/sch/$sekolah/situs/domain", label: "Domain", icon: <IconMapPin /> },
];

export function SitusLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = TABS.map((t) => ({
    key: t.to,
    label: t.label,
    icon: t.icon,
    active: t.exact ? pathname.endsWith("/situs") : pathname.includes(t.to.replace("/sch/$sekolah", "")),
    render: ({ className, children }) => (
      <Link to={t.to} className={className}>
        {children}
      </Link>
    ),
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/situs")({ component: SitusLayout });

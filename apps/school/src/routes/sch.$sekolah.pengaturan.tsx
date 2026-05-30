import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Tabs, type TabItem, IconSettings, IconLayers, IconFlag } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

const TABS: { to: string; label: string; icon: ReactNode; exact?: boolean }[] = [
  { to: "/sch/$sekolah/pengaturan", label: "Umum", icon: <IconSettings />, exact: true },
  { to: "/sch/$sekolah/pengaturan/modul", label: "Modul Aktif", icon: <IconLayers /> },
  { to: "/sch/$sekolah/pengaturan/feature-flag", label: "Feature Flag", icon: <IconFlag /> },
];

// Badge = jumlah item aktif/on per section. Limit tinggi: modul & flag selalu sedikit.
const COUNT_PARAMS = { fields: ["name"], limit_page_length: 100 };

function PengaturanLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const modulOn = useResourceList<{ name: string }>("Modul Aktif", { ...COUNT_PARAMS, filters: [["aktif", "=", 1]] });
  const flagOn = useResourceList<{ name: string }>("Feature Flag", { ...COUNT_PARAMS, filters: [["enabled", "=", 1]] });
  const counts: Record<string, number | undefined> = {
    "/sch/$sekolah/pengaturan/modul": modulOn.data?.length,
    "/sch/$sekolah/pengaturan/feature-flag": flagOn.data?.length,
  };

  const items: TabItem[] = TABS.map((t) => ({
    key: t.to,
    label: t.label,
    icon: t.icon,
    count: counts[t.to],
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => <Link to={t.to} className={className}>{children}</Link>,
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan")({ component: PengaturanLayout });

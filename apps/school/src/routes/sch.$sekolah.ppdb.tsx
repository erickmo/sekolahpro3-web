import type { ComponentType, SVGProps } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Tabs,
  type TabItem,
  IconHome,
  IconPlus,
  IconFile,
  IconUsers,
  IconLayers,
  IconCheck,
  IconWallet,
  IconGrad,
  IconSettings,
} from "@sekolahpro/ui";

// Each tab carries a leading icon to speed visual scanning of the 9-tab PPDB bar.
type TabIcon = ComponentType<SVGProps<SVGSVGElement>>;

const TABS: { to: string; label: string; icon: TabIcon; exact?: boolean }[] = [
  { to: "/sch/$sekolah/ppdb", label: "Dashboard", icon: IconHome, exact: true },
  { to: "/sch/$sekolah/ppdb/buat", label: "Buat PPDB", icon: IconPlus },
  { to: "/sch/$sekolah/ppdb/daftar", label: "Pendaftaran", icon: IconFile },
  { to: "/sch/$sekolah/ppdb/calon-siswa", label: "Calon Siswa", icon: IconUsers },
  { to: "/sch/$sekolah/ppdb/gelombang", label: "Gelombang", icon: IconLayers },
  { to: "/sch/$sekolah/ppdb/seleksi", label: "Seleksi", icon: IconCheck },
  { to: "/sch/$sekolah/ppdb/pembayaran", label: "Pembayaran", icon: IconWallet },
  { to: "/sch/$sekolah/ppdb/daftar-ulang", label: "Daftar Ulang", icon: IconGrad },
  { to: "/sch/$sekolah/ppdb/pengaturan", label: "Pengaturan", icon: IconSettings },
];

function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = TABS.map((t) => {
    const Icon = t.icon;
    return {
      key: t.to,
      label: t.label,
      // Icon sizing is owned by the Tabs h-4 w-4 wrapper; the SVG fills 100% by default.
      icon: <Icon aria-hidden="true" />,
      active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
      render: ({ className, children }) => <Link to={t.to} className={className}>{children}</Link>,
    };
  });
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb")({ component: PpdbLayout });

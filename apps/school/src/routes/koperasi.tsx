import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/koperasi", label: "Dashboard", exact: true },
  { to: "/koperasi/daftar", label: "Anggota" },
  { to: "/koperasi/rekening", label: "Rekening" },
  { to: "/koperasi/transaksi", label: "Transaksi" },
  { to: "/koperasi/pembiayaan", label: "Pembiayaan" },
  { to: "/koperasi/angsuran", label: "Angsuran" },
  { to: "/koperasi/kartu", label: "Kartu RFID" },
  { to: "/koperasi/emoney", label: "E-Money" },
  { to: "/koperasi/kas-teller", label: "Kas Teller" },
  { to: "/koperasi/zis", label: "ZIS" },
  { to: "/koperasi/wakaf", label: "Wakaf" },
  { to: "/koperasi/shu", label: "SHU" },
  { to: "/koperasi/laporan", label: "Laporan" },
  { to: "/koperasi/pengaturan", label: "Pengaturan" },
];

function KoperasiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = TABS.map((t) => ({
    key: t.to,
    label: t.label,
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => (
      <Link to={t.to} className={className}>{children}</Link>
    ),
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/koperasi")({ component: KoperasiLayout });

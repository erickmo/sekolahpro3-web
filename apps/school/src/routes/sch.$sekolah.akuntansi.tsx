/**
 * Akuntansi layout — part of the unified Keuangan hub.
 *
 * Renders the shared hub nav (so /akuntansi pages feel like one module with
 * /keuangan), a sub-nav for the akuntansi sub-modules, then the active child.
 */
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";
import { KeuanganHubNav } from "../components/keuangan";

const SUBTABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/sch/$sekolah/akuntansi", label: "Ringkasan", exact: true },
  { to: "/sch/$sekolah/akuntansi/buku-besar", label: "Buku Besar" },
  { to: "/sch/$sekolah/akuntansi/anggaran", label: "Anggaran" },
  { to: "/sch/$sekolah/akuntansi/pajak", label: "Pajak" },
  { to: "/sch/$sekolah/akuntansi/referensi", label: "Referensi" },
];

function AkuntansiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = SUBTABS.map((t) => ({
    key: t.to,
    label: t.label,
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => <Link to={t.to} className={className}>{children}</Link>,
  }));
  return (
    <div className="space-y-5">
      <KeuanganHubNav pathname={pathname} />
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi")({ component: AkuntansiLayout });

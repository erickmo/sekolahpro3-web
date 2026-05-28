import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const SUBTABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/akuntansi/buku-besar", label: "Ringkasan", exact: true },
  { to: "/$sekolah/akuntansi/buku-besar/akun", label: "Bagan Akun" },
  { to: "/$sekolah/akuntansi/buku-besar/jurnal", label: "Jurnal Umum" },
  { to: "/$sekolah/akuntansi/buku-besar/pembayaran", label: "Pembayaran" },
  { to: "/$sekolah/akuntansi/buku-besar/gl", label: "GL Entry" },
];

function BukuBesarLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = SUBTABS.map((t) => ({
    key: t.to,
    label: t.label,
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

export const Route = createFileRoute("/$sekolah/akuntansi/buku-besar")({ component: BukuBesarLayout });

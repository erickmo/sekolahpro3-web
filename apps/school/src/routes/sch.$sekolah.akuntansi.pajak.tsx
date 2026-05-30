import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const SUBTABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/sch/$sekolah/akuntansi/pajak", label: "Ringkasan", exact: true },
  { to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", label: "SPT Masa PPN" },
  { to: "/sch/$sekolah/akuntansi/pajak/efaktur", label: "e-Faktur" },
  { to: "/sch/$sekolah/akuntansi/pajak/withholding", label: "Withholding" },
  { to: "/sch/$sekolah/akuntansi/pajak/ter", label: "Tarif TER & 4(2)" },
  { to: "/sch/$sekolah/akuntansi/pajak/tax-period", label: "Tax Period" },
  { to: "/sch/$sekolah/akuntansi/pajak/template", label: "Tax Template" },
];

function PajakLayout() {
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

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak")({ component: PajakLayout });

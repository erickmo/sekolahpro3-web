import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  StatCard,
  Card,
  DataTable,
  IconUsers,
  IconWallet,
  IconChart,
  IconAlert,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { resolveTenantDomain, type OrganisasiRow } from "../lib/tenants";
import { OrgStatusBadge } from "../components/StatusBadges";

// A tenant IS an Organisasi (ADR-0042/0043) — there is no `Tenant` doctype.
function Overview() {
  const tenantsQ = useResourceList<OrganisasiRow>("Organisasi", {
    fields: ["name", "nama", "status", "custom_domain", "subdomain", "domain_verified", "modified"],
    limit_page_length: 100,
    order_by: "modified desc",
  });

  const rows = tenantsQ.data ?? [];
  const totalTenants = rows.length;
  const activeTenants = rows.filter((r) => r.status === "Aktif").length;
  const inactiveTenants = rows.filter((r) => r.status === "Nonaktif").length;
  const verifiedDomains = rows.filter((r) => r.domain_verified === 1).length;

  const recent = rows.slice(0, 5);

  const columns: Column<OrganisasiRow>[] = [
    {
      key: "name",
      header: "Tenant",
      cell: (r) => (
        <Link to="/tenants/$id" params={{ id: r.name }} className="font-medium text-brand hover:underline">
          {r.nama ?? r.name}
        </Link>
      ),
    },
    { key: "domain", header: "Domain", cell: (r) => <span className="text-muted-fg">{resolveTenantDomain(r)}</span> },
    { key: "status", header: "Status", cell: (r) => <OrgStatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Ringkasan platform SekolahPro" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Total tenant"
          value={tenantsQ.isLoading ? "…" : totalTenants}
          icon={<IconUsers />}
          accent="brand"
        />
        <StatCard
          label="Aktif"
          value={tenantsQ.isLoading ? "…" : activeTenants}
          icon={<IconChart />}
          accent="emerald"
        />
        <StatCard
          label="Nonaktif"
          value={tenantsQ.isLoading ? "…" : inactiveTenants}
          icon={<IconAlert />}
          accent="rose"
          urgency={inactiveTenants > 0 ? "warn" : "normal"}
        />
        <StatCard
          label="Domain terverifikasi"
          value={tenantsQ.isLoading ? "…" : verifiedDomains}
          icon={<IconWallet />}
          accent="amber"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Tenant terbaru</div>
            <div className="text-xs text-muted-fg">5 aktivitas terakhir</div>
          </div>
          <Link to="/tenants" className="text-xs font-medium text-brand hover:underline">
            Lihat semua →
          </Link>
        </div>
        <DataTable<OrganisasiRow>
          data={recent}
          columns={columns}
          rowKey={(r) => r.name}
          empty={
            <div className="p-8 text-center text-sm text-muted-fg">
              {tenantsQ.error ? "Gagal memuat tenant." : "Belum ada tenant."}
            </div>
          }
        />
      </Card>
    </>
  );
}

export const Route = createFileRoute("/")({ component: Overview });

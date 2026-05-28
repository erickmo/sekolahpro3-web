import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  StatCard,
  Card,
  DataTable,
  Badge,
  IconUsers,
  IconWallet,
  IconChart,
  IconAlert,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

interface TenantRow {
  name: string;
  tenant_name?: string;
  status?: string;
  plan?: string;
  domain?: string;
  modified?: string;
}

function Overview() {
  const tenantsQ = useResourceList<TenantRow>("Tenant", {
    fields: ["name", "tenant_name", "status", "plan", "domain", "modified"],
    limit_page_length: 100,
    order_by: "modified desc",
  });

  const rows = tenantsQ.data ?? [];
  const totalTenants = rows.length;
  const activeTenants = rows.filter((r) => r.status === "Active").length;
  const trialTenants = rows.filter((r) => r.status === "Trial").length;
  const suspended = rows.filter((r) => r.status === "Suspended").length;

  const recent = rows.slice(0, 5);

  const columns: Column<TenantRow>[] = [
    {
      key: "name",
      header: "Tenant",
      cell: (r) => (
        <Link to="/tenants/$id" params={{ id: r.name }} className="font-medium text-brand hover:underline">
          {r.tenant_name ?? r.name}
        </Link>
      ),
    },
    { key: "domain", header: "Domain", cell: (r) => <span className="text-muted-fg">{r.domain ?? "—"}</span> },
    { key: "plan", header: "Plan", cell: (r) => r.plan ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status ?? ""} />,
    },
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
          label="Trial"
          value={tenantsQ.isLoading ? "…" : trialTenants}
          icon={<IconWallet />}
          accent="amber"
        />
        <StatCard
          label="Suspended"
          value={tenantsQ.isLoading ? "…" : suspended}
          icon={<IconAlert />}
          accent="rose"
          urgency={suspended > 0 ? "warn" : "normal"}
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
        <DataTable<TenantRow>
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

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-fg">—</span>;
  const tone: "success" | "brand" | "danger" | "neutral" =
    status === "Active" ? "success" : status === "Trial" ? "brand" : status === "Suspended" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export const Route = createFileRoute("/")({ component: Overview });

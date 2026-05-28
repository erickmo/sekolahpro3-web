import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  Card,
  Badge,
  Tabs,
  InfoField,
  Breadcrumb,
  EmptyState,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { useState } from "react";

interface Tenant {
  name: string;
  tenant_name?: string;
  domain?: string;
  status?: string;
  plan?: string;
  billing_email?: string;
  creation?: string;
  modified?: string;
  trial_ends?: string;
  notes?: string;
}

function TenantDetail() {
  const { id } = Route.useParams();
  const tenantQ = useResourceDoc<Tenant>("Tenant", id);
  const [tab, setTab] = useState("overview");

  if (tenantQ.isLoading) {
    return <div className="p-6 text-muted-fg">Memuat…</div>;
  }
  if (tenantQ.error || !tenantQ.data) {
    return (
      <EmptyState
        title="Tenant tidak ditemukan"
        description={`ID "${id}" tidak terdaftar atau gagal dimuat.`}
      />
    );
  }

  const t = tenantQ.data;

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: "Tenants",
            render: ({ className, children }) => (
              <Link to="/tenants" className={className}>
                {children}
              </Link>
            ),
          },
          { label: t.tenant_name ?? t.name },
        ]}
      />

      <PageHeader
        title={t.tenant_name ?? t.name}
        description={t.domain ?? "Tanpa domain"}
        actions={<StatusBadge status={t.status ?? ""} />}
        className="mt-2"
      />

      <div className="mt-6">
        <Tabs
          items={(["overview", "billing", "users", "logs"] as const).map((k) => ({
            key: k,
            label: k === "overview" ? "Overview" : k === "billing" ? "Billing" : k === "users" ? "Users" : "Audit log",
            active: tab === k,
            render: ({ className, children }) => (
              <button type="button" className={className} onClick={() => setTab(k)}>
                {children}
              </button>
            ),
          }))}
        />
      </div>

      <div className="mt-4">
        {tab === "overview" ? <OverviewPanel t={t} /> : null}
        {tab === "billing" ? <PlaceholderPanel label="Billing belum tersedia." /> : null}
        {tab === "users" ? <PlaceholderPanel label="Users tenant belum tersedia." /> : null}
        {tab === "logs" ? <PlaceholderPanel label="Audit log belum tersedia." /> : null}
      </div>
    </>
  );
}

function OverviewPanel({ t }: { t: Tenant }) {
  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoField label="Tenant ID" value={t.name} />
        <InfoField label="Plan" value={t.plan ?? "—"} />
        <InfoField label="Domain" value={t.domain ?? "—"} />
        <InfoField label="Billing email" value={t.billing_email ?? "—"} />
        <InfoField
          label="Trial berakhir"
          value={t.trial_ends ? new Date(t.trial_ends).toLocaleDateString("id-ID") : "—"}
        />
        <InfoField
          label="Onboard"
          value={t.creation ? new Date(t.creation).toLocaleDateString("id-ID") : "—"}
        />
      </div>
      {t.notes ? (
        <div className="mt-6 border-t border-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Catatan</div>
          <p className="text-sm">{t.notes}</p>
        </div>
      ) : null}
    </Card>
  );
}

function PlaceholderPanel({ label }: { label: string }) {
  return (
    <Card>
      <div className="py-10 text-center text-sm text-muted-fg">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  const tone: "success" | "brand" | "danger" | "neutral" =
    status === "Active" ? "success" : status === "Trial" ? "brand" : status === "Suspended" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export const Route = createFileRoute("/tenants/$id")({ component: TenantDetail });

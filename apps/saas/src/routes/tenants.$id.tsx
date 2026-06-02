import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  Card,
  Tabs,
  InfoField,
  Breadcrumb,
  EmptyState,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import { useState } from "react";
import {
  resolveTenantDomain,
  latestLangganan,
  type OrganisasiRow,
  type LanggananRow,
} from "../lib/tenants";
import { OrgStatusBadge, LanggananStatusBadge } from "../components/StatusBadges";

function fmtDate(v: string | undefined): string {
  return v ? new Date(v).toLocaleDateString("id-ID") : "—";
}

function TenantDetail() {
  const { id } = Route.useParams();
  const orgQ = useResourceDoc<OrganisasiRow>("Organisasi", id);
  // Plan/billing live on the separate Langganan doctype, linked by `organisasi`.
  // Fetch a few newest rows so `latestLangganan` can prefer an Aktif one.
  const langgananQ = useResourceList<LanggananRow>(
    "Langganan",
    {
      filters: { organisasi: id },
      fields: ["name", "paket", "periode", "status", "tanggal_mulai", "tanggal_selesai", "nominal"],
      order_by: "tanggal_mulai desc",
      limit_page_length: 5,
    },
    { enabled: !!id },
  );
  const [tab, setTab] = useState("overview");

  if (orgQ.isLoading) {
    return <div className="p-6 text-muted-fg">Memuat…</div>;
  }
  if (orgQ.error || !orgQ.data) {
    return (
      <EmptyState
        title="Tenant tidak ditemukan"
        description={`ID "${id}" tidak terdaftar atau gagal dimuat.`}
      />
    );
  }

  const org = orgQ.data;
  const langganan = latestLangganan(langgananQ.data);

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
          { label: org.nama ?? org.name },
        ]}
      />

      <PageHeader
        title={org.nama ?? org.name}
        description={resolveTenantDomain(org)}
        actions={<OrgStatusBadge status={org.status} />}
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
        {tab === "overview" ? <OverviewPanel org={org} langganan={langganan} /> : null}
        {tab === "billing" ? <BillingPanel langganan={langganan} loading={langgananQ.isLoading} /> : null}
        {tab === "users" ? <PlaceholderPanel label="Users tenant belum tersedia." /> : null}
        {tab === "logs" ? <PlaceholderPanel label="Audit log belum tersedia." /> : null}
      </div>
    </>
  );
}

function OverviewPanel({ org, langganan }: { org: OrganisasiRow; langganan: LanggananRow | null }) {
  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoField label="Tenant ID" value={org.name} />
        <InfoField label="Jenis" value={org.jenis_organisasi ?? "—"} />
        <InfoField label="Domain" value={resolveTenantDomain(org)} />
        <InfoField label="Email pemilik" value={org.owner_email ?? "—"} />
        <InfoField label="Paket" value={langganan?.paket ?? "—"} />
        <InfoField label="Langganan berakhir" value={fmtDate(langganan?.tanggal_selesai)} />
        <InfoField label="Onboard" value={fmtDate(org.creation)} />
      </div>
    </Card>
  );
}

function BillingPanel({ langganan, loading }: { langganan: LanggananRow | null; loading: boolean }) {
  if (loading) return <Card><div className="py-10 text-center text-sm text-muted-fg">Memuat…</div></Card>;
  if (!langganan) {
    return <Card><div className="py-10 text-center text-sm text-muted-fg">Belum ada langganan.</div></Card>;
  }
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-semibold">Langganan aktif</span>
        <LanggananStatusBadge status={langganan.status} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoField label="Paket" value={langganan.paket ?? "—"} />
        <InfoField label="Periode" value={langganan.periode ?? "—"} />
        <InfoField label="Mulai" value={fmtDate(langganan.tanggal_mulai)} />
        <InfoField label="Berakhir" value={fmtDate(langganan.tanggal_selesai)} />
        <InfoField
          label="Nominal"
          value={
            langganan.nominal != null
              ? langganan.nominal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
              : "—"
          }
        />
      </div>
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

export const Route = createFileRoute("/tenants/$id")({ component: TenantDetail });

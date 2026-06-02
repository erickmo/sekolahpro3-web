import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  DataTable,
  Card,
  Input,
  Select,
  Button,
  IconPlus,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { resolveTenantDomain, type OrganisasiRow } from "../lib/tenants";
import { OrgStatusBadge } from "../components/StatusBadges";

// A tenant IS an Organisasi (ADR-0042/0043) — there is no `Tenant` doctype.
const STATUS_OPTIONS = ["", "Aktif", "Nonaktif"] as const;

function TenantsList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;

  const tenantsQ = useResourceList<OrganisasiRow>("Organisasi", {
    fields: ["name", "nama", "custom_domain", "subdomain", "status", "modified"],
    filters,
    limit_page_length: 200,
    order_by: "modified desc",
  });

  const rows = useMemo(() => {
    const data = tenantsQ.data ?? [];
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(
      (r) =>
        (r.nama ?? "").toLowerCase().includes(q) ||
        resolveTenantDomain(r).toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }, [tenantsQ.data, query]);

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
    { key: "domain", header: "Domain", cell: (r) => resolveTenantDomain(r) },
    { key: "status", header: "Status", cell: (r) => <OrgStatusBadge status={r.status} /> },
    {
      key: "modified",
      header: "Diperbarui",
      cell: (r) => (r.modified ? new Date(r.modified).toLocaleDateString("id-ID") : "—"),
      align: "right",
    },
  ];

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Semua sekolah yang onboard di platform"
        actions={
          <Button className="gap-2">
            <span className="h-4 w-4"><IconPlus /></span>
            Onboard tenant
          </Button>
        }
      />

      <Card className="mb-4 p-4 mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Cari nama atau domain…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s || "Semua status"}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <DataTable<OrganisasiRow>
          data={rows}
          columns={columns}
          rowKey={(r) => r.name}
          empty={
            <div className="p-8 text-center text-sm text-muted-fg">
              {tenantsQ.isLoading
                ? "Memuat…"
                : tenantsQ.error
                  ? "Gagal memuat tenant."
                  : "Tidak ada tenant cocok."}
            </div>
          }
        />
      </Card>
    </>
  );
}

export const Route = createFileRoute("/tenants/")({ component: TenantsList });

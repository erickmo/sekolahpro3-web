import { createFileRoute } from "@tanstack/react-router";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

interface StaffRow {
  name: string;
  full_name?: string;
  email?: string;
  enabled?: number;
  role_profile_name?: string;
}

function Users() {
  const staffQ = useResourceList<StaffRow>("User", {
    fields: ["name", "full_name", "email", "enabled", "role_profile_name"],
    filters: { user_type: "System User" },
    limit_page_length: 100,
  });

  const columns: Column<StaffRow>[] = [
    { key: "full_name", header: "Nama", cell: (r) => <span className="font-medium">{r.full_name ?? r.name}</span> },
    { key: "email", header: "Email", cell: (r) => r.email ?? r.name },
    { key: "role_profile_name", header: "Role profile", cell: (r) => r.role_profile_name ?? "—" },
    {
      key: "enabled",
      header: "Status",
      cell: (r) => (r.enabled ? <Badge tone="success">Aktif</Badge> : <Badge tone="neutral">Nonaktif</Badge>),
    },
  ];

  return (
    <>
      <PageHeader title="Staff & Roles" description="Internal admin SekolahPro" />
      <Card className="p-0 overflow-hidden mt-6">
        <DataTable<StaffRow>
          data={staffQ.data ?? []}
          columns={columns}
          rowKey={(r) => r.name}
          empty={
            <div className="p-8 text-center text-sm text-muted-fg">
              {staffQ.isLoading ? "Memuat…" : staffQ.error ? "Gagal memuat user." : "Tidak ada user."}
            </div>
          }
        />
      </Card>
    </>
  );
}

export const Route = createFileRoute("/users")({ component: Users });

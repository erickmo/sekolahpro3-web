import { createFileRoute } from "@tanstack/react-router";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  Button,
  IconPlus,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

interface PlanRow {
  name: string;
  plan_name?: string;
  price_idr?: number;
  interval?: string;
  is_active?: number;
  max_students?: number;
}

function Plans() {
  const plansQ = useResourceList<PlanRow>("SaaS Plan", {
    fields: ["name", "plan_name", "price_idr", "interval", "is_active", "max_students"],
    limit_page_length: 50,
  });

  const columns: Column<PlanRow>[] = [
    { key: "plan_name", header: "Plan", cell: (r) => <span className="font-medium">{r.plan_name ?? r.name}</span> },
    {
      key: "price_idr",
      header: "Harga",
      cell: (r) =>
        r.price_idr != null
          ? `Rp ${r.price_idr.toLocaleString("id-ID")}`
          : "—",
      align: "right",
    },
    { key: "interval", header: "Interval", cell: (r) => r.interval ?? "—" },
    { key: "max_students", header: "Max siswa", cell: (r) => r.max_students ?? "—", align: "right" },
    {
      key: "is_active",
      header: "Status",
      cell: (r) => (r.is_active ? <Badge tone="success">Aktif</Badge> : <Badge tone="neutral">Nonaktif</Badge>),
    },
  ];

  return (
    <>
      <PageHeader
        title="Plans"
        description="Paket langganan SekolahPro"
        actions={
          <Button className="gap-2">
            <span className="h-4 w-4"><IconPlus /></span>
            Buat plan
          </Button>
        }
      />
      <Card className="p-0 overflow-hidden mt-6">
        <DataTable<PlanRow>
          data={plansQ.data ?? []}
          columns={columns}
          rowKey={(r) => r.name}
          empty={
            <div className="p-8 text-center text-sm text-muted-fg">
              {plansQ.isLoading ? "Memuat…" : plansQ.error ? "Gagal memuat plan." : "Belum ada plan."}
            </div>
          }
        />
      </Card>
    </>
  );
}

export const Route = createFileRoute("/plans")({ component: Plans });

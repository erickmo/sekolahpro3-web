import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, StatCard, IconChart, IconAlert, IconSettings } from "@sekolahpro/ui";

function Ops() {
  return (
    <>
      <PageHeader title="Ops & Health" description="Status sistem dan latency" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6">
        <StatCard label="Uptime 30d" value="—" icon={<IconChart />} accent="emerald" hint="Belum terhubung" />
        <StatCard label="Error rate" value="—" icon={<IconAlert />} accent="rose" hint="Belum terhubung" />
        <StatCard label="Queue depth" value="—" icon={<IconSettings />} accent="amber" hint="Belum terhubung" />
      </div>
      <Card className="mt-6">
        <div className="py-10 text-center text-sm text-muted-fg">
          Health dashboard akan ditampilkan setelah metrics endpoint disiapkan.
        </div>
      </Card>
    </>
  );
}

export const Route = createFileRoute("/ops")({ component: Ops });

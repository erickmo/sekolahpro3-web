import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, StatCard, IconWallet, IconChart } from "@sekolahpro/ui";

function Billing() {
  return (
    <>
      <PageHeader title="Billing" description="Invoice & langganan tenant" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6">
        <StatCard label="MRR" value="—" icon={<IconWallet />} accent="brand" hint="Belum terhubung" />
        <StatCard label="ARR" value="—" icon={<IconChart />} accent="emerald" hint="Belum terhubung" />
        <StatCard label="Outstanding" value="—" icon={<IconWallet />} accent="amber" hint="Belum terhubung" />
      </div>
      <Card className="mt-6">
        <div className="py-10 text-center text-sm text-muted-fg">
          Billing & invoice list akan tampil di sini setelah endpoint disiapkan.
        </div>
      </Card>
    </>
  );
}

export const Route = createFileRoute("/billing")({ component: Billing });

import { createFileRoute } from "@tanstack/react-router";
import {
  PageHeader,
  SectionCard,
  StatCard,
  IconChart,
  IconCheck,
  IconBook,
} from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { useChildDashboard } from "../data/dashboard";

function DashboardPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildDashboard(activeNis);
  const active = children.find((c) => c.nis === activeNis);

  return (
    <div className="space-y-6">
      <PageHeader
        title={active ? `Dashboard ${active.nama}` : "Dashboard"}
        description={active ? `${active.kelas} · NIS ${active.nis}` : undefined}
      />
      {isLoading || !data ? (
        <div className="text-sm text-muted-fg">Memuat…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Rerata Nilai"
              value={data.rerataNilai}
              icon={<IconChart />}
              accent="brand"
            />
            <StatCard
              label="Kehadiran"
              value={data.kehadiranPct}
              icon={<IconCheck />}
              accent="emerald"
            />
            <StatCard
              label="Tugas Pending"
              value={data.tugasPending}
              icon={<IconBook />}
              accent="amber"
            />
          </div>
          <SectionCard title="Info terkini" padded={false}>
            {data.infoTerkini.length === 0 ? (
              <div className="px-5 py-4 text-sm text-muted-fg">Belum ada info.</div>
            ) : (
              <ul className="divide-y divide-border">
                {data.infoTerkini.map((info) => (
                  <li key={info.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-fg">{info.title}</div>
                        <p className="mt-0.5 text-xs text-muted-fg">{info.body}</p>
                      </div>
                      <span className="text-xs text-muted-fg shrink-0">{info.ago}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

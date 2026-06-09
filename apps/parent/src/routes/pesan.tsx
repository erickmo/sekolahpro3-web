import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { usePesanList } from "../data/pesan";
import { PesanWaliThread } from "../components/PesanWaliThread";

function PesanPage() {
  const { children, activeNis } = useActiveChild();
  const { data, isLoading } = usePesanList();
  const items = data ?? [];
  const nameByNis = new Map(children.map((c) => [c.nis, c.nama]));
  const activeChildName = activeNis ? nameByNis.get(activeNis) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Pesan" />

      <PesanWaliThread nis={activeNis} childName={activeChildName} />

      <SectionCard title="Kotak masuk" padded={false}>
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Belum ada pesan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((p) => {
              const childName = p.nis ? nameByNis.get(p.nis) : null;
              return (
                <li key={p.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-fg">{p.judul}</div>
                      <div className="mt-0.5 text-xs text-muted-fg">
                        {p.pengirim}
                        {childName ? ` · ${childName}` : ""}
                      </div>
                      <p className="mt-1.5 text-sm text-fg/80">{p.isi}</p>
                    </div>
                    <span className="text-xs text-muted-fg tabular-nums shrink-0">{p.dikirim}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/pesan")({
  component: () => (
    <RequireAuth>
      <PesanPage />
    </RequireAuth>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { useChildNilai } from "../data/nilai";

function NilaiPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildNilai(activeNis);
  const active = children.find((c) => c.nis === activeNis);
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Nilai" description={active?.nama} />
      <SectionCard title="Daftar nilai" padded={false}>
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Belum ada nilai.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">{n.mapel}</div>
                  <div className="text-xs text-muted-fg">{n.semester}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-fg">{n.nilaiAngka}</span>
                  <Badge tone="brand">{n.nilaiHuruf}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/nilai")({
  component: () => (
    <RequireAuth>
      <NilaiPage />
    </RequireAuth>
  ),
});

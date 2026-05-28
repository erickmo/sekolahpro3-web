import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { useChildJadwal } from "../data/jadwal";

function JadwalPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildJadwal(activeNis);
  const active = children.find((c) => c.nis === activeNis);
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Jadwal Pelajaran" description={active?.nama} />
      <SectionCard title="Minggu ini" padded={false}>
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Belum ada jadwal.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-fg">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Hari</th>
                  <th className="px-5 py-2.5 font-medium">Jam</th>
                  <th className="px-5 py-2.5 font-medium">Mapel</th>
                  <th className="px-5 py-2.5 font-medium">Guru</th>
                  <th className="px-5 py-2.5 font-medium">Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((j) => (
                  <tr key={j.id}>
                    <td className="px-5 py-3 text-fg">{j.hari}</td>
                    <td className="px-5 py-3 tabular-nums text-fg">{j.jamMulai}–{j.jamSelesai}</td>
                    <td className="px-5 py-3 text-fg">{j.mapel}</td>
                    <td className="px-5 py-3 text-muted-fg">{j.guru}</td>
                    <td className="px-5 py-3 text-muted-fg">{j.ruang}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/jadwal")({
  component: () => (
    <RequireAuth>
      <JadwalPage />
    </RequireAuth>
  ),
});

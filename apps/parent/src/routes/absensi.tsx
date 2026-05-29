import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { RequireAuth } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";
import { useChildAbsensi } from "../data/absensi";
import type { AbsensiItem } from "../data/types";

type Tone = "success" | "warning" | "brand" | "danger";

const STATUS_TONE: Record<AbsensiItem["status"], Tone> = {
  hadir: "success",
  izin: "warning",
  sakit: "brand",
  alpa: "danger",
};

const STATUS_LABEL: Record<AbsensiItem["status"], string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

function AbsensiPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildAbsensi(activeNis);
  const active = children.find((c) => c.nis === activeNis);
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Absensi" description={active?.nama} />
      <SectionCard title="Riwayat" padded={false}>
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Belum ada catatan absensi.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg tabular-nums">{a.tanggal}</div>
                  {a.catatan ? (
                    <div className="mt-0.5 text-xs text-muted-fg">{a.catatan}</div>
                  ) : null}
                </div>
                <Badge tone={STATUS_TONE[a.status]} dot>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/absensi")({
  component: () => (
    <RequireAuth>
      <AbsensiPage />
    </RequireAuth>
  ),
});

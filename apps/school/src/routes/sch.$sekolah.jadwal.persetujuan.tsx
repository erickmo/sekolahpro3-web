import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { JADWAL_ACTIONS, useJadwalTransition } from "../components/jadwal-extra/workflowActions";

interface JadwalRow {
  name: string;
  rombel?: string;
  semester?: string;
  tahun_ajaran?: string;
}

function PersetujuanPage() {
  const q = useResourceList<JadwalRow>("Jadwal Pelajaran", {
    fields: ["name", "rombel", "semester", "tahun_ajaran"],
    filters: { workflow_state: "Diajukan" },
    limit_page_length: 0,
  });
  const rows = q.data ?? [];

  const { transisi, isPending } = useJadwalTransition();
  const [error, setError] = useState<string | null>(null);

  async function act(name: string, action: (typeof JADWAL_ACTIONS)[keyof typeof JADWAL_ACTIONS]) {
    setError(null);
    try {
      await transisi(name, action);
      q.refetch();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Persetujuan Jadwal"
        description="Jadwal yang diajukan Tata Usaha menunggu keputusan Anda."
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="persetujuan"
        title="Cara pakai Persetujuan"
        intro="Setujui untuk meneruskan ke penerbitan, atau Tolak untuk mengembalikan ke penyusun."
        steps={[
          { title: "Tinjau pengajuan", detail: "Setiap baris adalah satu jadwal rombel yang diajukan.", roles: ["kepala_sekolah"] },
          { title: "Setujui / Tolak", detail: "Setujui → Disetujui Kepsek; Tolak → kembali ke Draft penyusun.", roles: ["kepala_sekolah"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      {error && <Badge tone="danger">{error}</Badge>}

      <SectionCard title="Menunggu Persetujuan" description="Status: Diajukan." padded={false}>
        {q.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">
            Tidak ada jadwal menunggu persetujuan.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg truncate">{r.rombel ?? r.name}</div>
                  <div className="text-xs text-muted-fg truncate">
                    {r.tahun_ajaran ?? "—"} · {r.semester ?? "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={isPending} onClick={() => act(r.name, JADWAL_ACTIONS.tolak)}>
                    Tolak
                  </Button>
                  <Button disabled={isPending} onClick={() => act(r.name, JADWAL_ACTIONS.setujui)}>
                    Setujui
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/persetujuan")({ component: PersetujuanPage });

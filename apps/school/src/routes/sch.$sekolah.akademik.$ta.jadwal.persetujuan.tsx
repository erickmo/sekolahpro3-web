import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useFrappeMethod, useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { JADWAL_ACTIONS, type JadwalAction, useJadwalTransition } from "../components/jadwal-extra/workflowActions";

const METHOD_KELAYAKAN = "sekolahpro.akademik.api.jadwal.kelayakan_jadwal";

interface JadwalRow {
  name: string;
  rombel?: string;
  semester?: string;
  tahun_ajaran?: string;
}

interface Kelayakan {
  layak: boolean;
  total_slot: number;
  slot_tanpa_guru: number;
}

// One pending schedule. Setujui is GATED behind compliance (kelayakan_jadwal):
// a schedule with empty slots or missing teachers cannot be rubber-stamped.
function PersetujuanRow({
  row,
  busy,
  onAct,
}: {
  row: JadwalRow;
  busy: boolean;
  onAct: (name: string, action: JadwalAction) => void;
}) {
  const kQ = useFrappeMethod<Kelayakan>(METHOD_KELAYAKAN, { name: row.name });
  const layak = kQ.data?.layak ?? false;
  const lubang = kQ.data?.slot_tanpa_guru ?? 0;
  const kosong = (kQ.data?.total_slot ?? 0) === 0;

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg truncate">{row.rombel ?? row.name}</span>
          {!kQ.isLoading && lubang > 0 && <Badge tone="warning">{lubang} slot tanpa guru</Badge>}
          {!kQ.isLoading && kosong && <Badge tone="warning">belum ada slot</Badge>}
        </div>
        <div className="text-xs text-muted-fg truncate">
          {row.tahun_ajaran ?? "—"} · {row.semester ?? "—"}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy} onClick={() => onAct(row.name, JADWAL_ACTIONS.tolak)}>
          Tolak
        </Button>
        <Button
          disabled={busy || !layak}
          title={!layak ? "Lengkapi slot & guru sebelum menyetujui" : undefined}
          onClick={() => onAct(row.name, JADWAL_ACTIONS.setujui)}
        >
          Setujui
        </Button>
      </div>
    </li>
  );
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

  async function act(name: string, action: JadwalAction) {
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
              <PersetujuanRow key={r.name} row={r} busy={isPending} onAct={act} />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/jadwal/persetujuan")({ component: PersetujuanPage });

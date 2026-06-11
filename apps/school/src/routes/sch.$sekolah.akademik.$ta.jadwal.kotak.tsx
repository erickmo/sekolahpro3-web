import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Button, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useFrappeMutation, useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

interface PermintaanRow {
  name: string;
  tipe: string;
  tanggal: string;
  guru_asli?: string;
  guru_pengganti?: string;
  alasan?: string;
}

const DOCTYPE = "Permintaan Jadwal";
const METHOD_TRANSISI = "sekolahpro.akademik.api.jadwal.transisi_permintaan";

function KotakPermintaanPage() {
  const q = useResourceList<PermintaanRow>(DOCTYPE, {
    fields: ["name", "tipe", "tanggal", "guru_asli", "guru_pengganti", "alasan"],
    filters: { workflow_state: "Diajukan" },
    limit_page_length: 0,
  });
  const rows = q.data ?? [];

  const qc = useQueryClient();
  const proses = useFrappeMutation<{ name: string; action: string }, string>(METHOD_TRANSISI);
  const [error, setError] = useState<string | null>(null);

  async function act(name: string, action: "Setujui" | "Tolak") {
    setError(null);
    try {
      await proses.mutateAsync({ name, action });
      qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      q.refetch();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Kotak Permintaan"
        description="Permintaan izin, tukar, dan pengganti yang masuk dari guru — proses di sini."
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="kotak-permintaan"
        title="Cara pakai Kotak Permintaan"
        intro="Setiap baris adalah permintaan yang menunggu. Setujui untuk menindaklanjuti, Tolak untuk menutup."
        steps={[
          { title: "Baca permintaan", detail: "Tipe, tanggal, guru asli & pengganti, serta alasan tampil per baris.", roles: ["tata_usaha", "operator"] },
          { title: "Setujui / Tolak", detail: "Setujui → status Disetujui; Tolak → Ditolak (guru diberi tahu).", roles: ["tata_usaha"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      {error && <Badge tone="danger">{error}</Badge>}

      <SectionCard title="Menunggu Diproses" description="Status: Diajukan." padded={false}>
        {q.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">Tidak ada permintaan menunggu.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{r.tipe}</Badge>
                    <span className="text-sm font-medium text-fg">{r.tanggal}</span>
                  </div>
                  <div className="text-xs text-muted-fg truncate mt-0.5">
                    {r.guru_asli ?? "—"}
                    {r.guru_pengganti ? ` → ${r.guru_pengganti}` : ""}
                    {r.alasan ? ` · ${r.alasan}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={proses.isPending} onClick={() => act(r.name, "Tolak")}>
                    Tolak
                  </Button>
                  <Button disabled={proses.isPending} onClick={() => act(r.name, "Setujui")}>
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

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/jadwal/kotak")({ component: KotakPermintaanPage });

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import {
  useFrappeMethod,
  useFrappeMutation,
  useResourceCreate,
  useResourceList,
} from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

interface JtmResult {
  guru: string;
}

interface PermintaanRow {
  name: string;
  tipe: string;
  tanggal: string;
  alasan?: string;
  workflow_state?: string;
}

const METHOD_JTM = "sekolahpro.akademik.api.jadwal.jtm_saya";
const METHOD_TRANSISI = "sekolahpro.akademik.api.jadwal.transisi_permintaan";
const DOCTYPE = "Permintaan Jadwal";

// Workflow state -> badge tone for the request list.
const STATE_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  Draft: "neutral",
  Diajukan: "brand",
  Disetujui: "success",
  Selesai: "success",
  Ditolak: "danger",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function PermintaanSayaPage() {
  const jtmQ = useFrappeMethod<JtmResult>(METHOD_JTM, {});
  const guru = jtmQ.data?.guru;

  const listQ = useResourceList<PermintaanRow>(DOCTYPE, {
    fields: ["name", "tipe", "tanggal", "alasan", "workflow_state"],
    filters: guru ? { guru_asli: guru } : { name: ["=", "__none__"] },
    limit_page_length: 0,
  });
  const rows = listQ.data ?? [];

  const guruListQ = useResourceList<{ name: string }>("Pegawai", { fields: ["name"], limit_page_length: 0 });

  const create = useResourceCreate<PermintaanRow>(DOCTYPE);
  const ajukan = useFrappeMutation<{ name: string; action: string }, string>(METHOD_TRANSISI);

  const [tipe, setTipe] = useState<"Izin" | "Tukar">("Izin");
  const [tanggal, setTanggal] = useState<string>(todayIso());
  const [alasan, setAlasan] = useState<string>("");
  const [guruPengganti, setGuruPengganti] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const submitting = create.isPending || ajukan.isPending;

  async function handleAjukan() {
    setError(null);
    if (!guru) {
      setError("Akun ini tidak terkait data Pegawai.");
      return;
    }
    if (tipe === "Tukar" && !guruPengganti) {
      setError("Pilih guru pengganti untuk permintaan Tukar.");
      return;
    }
    try {
      const payload: Record<string, unknown> = { tipe, tanggal, guru_asli: guru, alasan };
      if (tipe === "Tukar") payload.guru_pengganti = guruPengganti;
      const created = await create.mutateAsync(payload);
      // Submit to the Tata Usaha inbox immediately (Draft -> Diajukan).
      await ajukan.mutateAsync({ name: created.name, action: "Ajukan" });
      setAlasan("");
      setGuruPengganti("");
      listQ.refetch();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Permintaan Saya"
        description="Ajukan izin tidak mengajar dan pantau status permintaan Anda."
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="permintaan-saya"
        title="Cara pakai Permintaan Saya"
        intro="Ajukan izin untuk tanggal tertentu; Tata Usaha akan memprosesnya."
        steps={[
          { title: "Isi tanggal & alasan", detail: "Pilih tanggal izin dan tulis alasan singkat.", roles: ["guru"] },
          { title: "Ajukan", detail: "Permintaan langsung masuk ke Kotak Tata Usaha (status Diajukan).", roles: ["guru"] },
          { title: "Pantau status", detail: "Badge menandai Diajukan / Disetujui / Ditolak.", roles: ["guru"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <SectionCard title="Ajukan Permintaan" description="Izin tidak mengajar, atau Tukar jam dengan guru lain.">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Tipe</span>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value as "Izin" | "Tukar")}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg"
            >
              <option value="Izin">Izin</option>
              <option value="Tukar">Tukar</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Tanggal</span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg"
            />
          </label>
          {tipe === "Tukar" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-fg">Guru Pengganti</span>
              <select
                value={guruPengganti}
                onChange={(e) => setGuruPengganti(e.target.value)}
                className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg min-w-[10rem]"
              >
                <option value="">— pilih —</option>
                {(guruListQ.data ?? [])
                  .filter((g) => g.name !== guru)
                  .map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </label>
          )}
          <label className="flex flex-1 flex-col gap-1 text-sm min-w-[12rem]">
            <span className="text-muted-fg">Alasan</span>
            <input
              type="text"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="mis. Sakit / tugas dinas"
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg"
            />
          </label>
          <Button onClick={handleAjukan} disabled={submitting}>
            {submitting ? "Mengajukan…" : "Ajukan"}
          </Button>
        </div>
        {error && (
          <div className="mt-3">
            <Badge tone="danger">{error}</Badge>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Riwayat Permintaan" description="Permintaan yang pernah Anda ajukan." padded={false}>
        {listQ.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">Belum ada permintaan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg">
                    {r.tipe} · {r.tanggal}
                  </div>
                  {r.alasan && <div className="text-xs text-muted-fg truncate">{r.alasan}</div>}
                </div>
                <Badge tone={STATE_TONE[r.workflow_state ?? "Draft"] ?? "neutral"}>
                  {r.workflow_state ?? "Draft"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/permintaan")({ component: PermintaanSayaPage });

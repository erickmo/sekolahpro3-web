import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  IconCalendar,
  IconClock,
} from "@sekolahpro/ui";
import { useFrappeMethod } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

// One effective teaching slot for the logged-in guru on a given date, returned
// by `agenda_saya` (resolver per-rombel already applied override semantics).
interface AgendaSlot {
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran: string | null;
  rombel: string;
  ruangan: string | null;
  tipe: string;
  sumber: "tetap" | "pengganti" | "tambahan";
}

interface AgendaResult {
  tanggal: string;
  hari: string;
  guru: string;
  slots: AgendaSlot[];
}

const METHOD_AGENDA = "sekolahpro.akademik.api.jadwal.agenda_saya";

// Badge framing per slot source — overrides surface as inline events on the feed
// (the "override IS the change" idea from the Guru tournament winner).
const SUMBER_BADGE: Record<AgendaSlot["sumber"], { label: string; tone: "neutral" | "warning" | "brand" }> = {
  tetap: { label: "Tetap", tone: "neutral" },
  pengganti: { label: "Pengganti", tone: "warning" },
  tambahan: { label: "Tambahan", tone: "brand" },
};

/** Today's date as an ISO `YYYY-MM-DD` string for the default date input value. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function AgendaSayaPage() {
  const [tanggal, setTanggal] = useState<string>(todayIso());
  const q = useFrappeMethod<AgendaResult>(METHOD_AGENDA, { tanggal });

  const slots = useMemo(() => q.data?.slots ?? [], [q.data]);
  const libur = !q.isLoading && !q.isError && slots.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Agenda Mengajar Saya"
        description="Kelas yang Anda ampu pada tanggal terpilih, sudah memperhitungkan libur, pengganti, dan jam tambahan."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="h-4 w-4 text-muted-fg"><IconCalendar /></span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg"
              aria-label="Pilih tanggal agenda"
            />
          </label>
        }
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="agenda-saya"
        title="Cara pakai Agenda Mengajar Saya"
        intro="Daftar mengajar harian Anda — bukan grid master. Ganti tanggal untuk melihat hari lain."
        steps={[
          { title: "Pilih tanggal", detail: "Gunakan pemilih tanggal di kanan atas; bawaan hari ini.", roles: ["guru"] },
          { title: "Baca sumber slot", detail: "Label Tetap/Pengganti/Tambahan menandai perubahan dari jadwal rutin.", roles: ["guru"] },
          { title: "Hari libur", detail: "Bila libur atau tidak ada kelas, daftar tampil kosong.", roles: ["guru"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <SectionCard
        title={q.data ? `${q.data.hari}, ${q.data.tanggal}` : "Agenda"}
        description={libur ? "Tidak ada kelas pada tanggal ini." : "Urut berdasarkan jam mulai."}
        padded={false}
      >
        {q.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat agenda…</div>
        ) : q.isError ? (
          <div className="px-5 py-4">
            <Badge tone="danger">Gagal memuat: {(q.error as Error).message}</Badge>
          </div>
        ) : slots.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">
            Tidak ada jadwal mengajar pada tanggal ini.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {slots.map((s, i) => {
              const badge = SUMBER_BADGE[s.sumber] ?? SUMBER_BADGE.tetap;
              return (
                <li key={`${s.rombel}-${s.jam_mulai}-${i}`} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex w-24 shrink-0 items-center gap-1 text-xs font-semibold text-brand tabular-nums">
                    <span className="h-3 w-3"><IconClock /></span>
                    {s.jam_mulai}–{s.jam_selesai}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg truncate">{s.mata_pelajaran ?? "—"}</span>
                      {s.sumber !== "tetap" && <Badge tone={badge.tone}>{badge.label}</Badge>}
                    </div>
                    <div className="text-xs text-muted-fg truncate mt-0.5">
                      {s.rombel}
                      {s.ruangan ? ` · Ruang ${s.ruangan}` : ""}
                    </div>
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

export const Route = createFileRoute("/sch/$sekolah/jadwal/agenda")({ component: AgendaSayaPage });

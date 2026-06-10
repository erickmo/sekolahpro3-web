/**
 * Kelasku — the Wali Kelas cockpit (/kelas/saya). The /kelas index redirects a
 * homeroom teacher here.
 *
 * Self-resolves the wali's own active rombel from the session user, shows a
 * seat-ordered roster, a class switcher when the wali owns more than one,
 * presence/risk panels, the Catatan Wali quick-notes store, and per-student
 * StudentSheet with one-tap Hubungi Wali + the roster-inline Pesan Wali
 * composer. The cockpit never shows fabricated numbers (honest empty-states,
 * audit graft from C1).
 */
import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useResourceList, useResourceDoc } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Badge, Button } from "@sekolahpro/ui";
import {
  resolveKelasku,
  sortRoster,
  type KelaskuRombel,
  type KelaskuAnggota,
} from "../lib/kelasku";
import { aggregatePresence, type AbsensiDetailRow } from "../lib/presence";
import { collectRiskFlags, type EntriNilaiRow } from "../lib/kelasRisk";
import { CatatanWaliPanel } from "../components/kelas/CatatanWaliPanel";
import { StudentSheet } from "../components/kelas/StudentSheet";

interface RombelDoc extends KelaskuRombel {
  anggota?: KelaskuAnggota[];
}

interface AbsensiDoc {
  name: string;
  detail?: AbsensiDetailRow[];
}

type PresenceCountKey = "hadir" | "sakit" | "izin" | "alpha" | "terlambat";
const PRESENCE_STATUSES: { key: PresenceCountKey; label: string }[] = [
  { key: "hadir", label: "Hadir" },
  { key: "sakit", label: "Sakit" },
  { key: "izin", label: "Izin" },
  { key: "alpha", label: "Alpa" },
  { key: "terlambat", label: "Telat" },
];

function KelaskuPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const user = useSessionStore((s) => s.user);

  const rombelQuery = useResourceList<KelaskuRombel>("Rombongan Belajar", {
    fields: ["name", "nama_rombel", "tingkat", "jumlah_siswa", "status", "wali_kelas"],
    filters: [
      ["wali_kelas", "=", user ?? ""],
      ["status", "=", "Aktif"],
    ],
    limit_page_length: 0,
  });

  const [preferred, setPreferred] = useState<string | undefined>();
  const [sheetSiswa, setSheetSiswa] = useState<string | null>(null);
  const res = resolveKelasku(rombelQuery.data ?? [], preferred);
  const activeName = res.kind === "none" ? "" : res.kind === "one" ? res.rombel.name : res.active.name;

  const docQuery = useResourceDoc<RombelDoc>("Rombongan Belajar", activeName);
  const roster = sortRoster(docQuery.data?.anggota ?? []);

  const today = new Date().toISOString().slice(0, 10);
  const absensiList = useResourceList<{ name: string }>("Absensi Harian", {
    fields: ["name"],
    filters: [
      ["rombel", "=", activeName],
      ["tanggal", "=", today],
    ],
    limit_page_length: 1,
  });
  const absensiName = absensiList.data?.[0]?.name ?? "";
  const absensiDoc = useResourceDoc<AbsensiDoc>("Absensi Harian", absensiName);
  const presence = aggregatePresence(absensiDoc.data?.detail ?? []);
  const diabsen = absensiName !== "";

  const rosterIds = roster.map((a) => a.siswa);
  const entriQuery = useResourceList<EntriNilaiRow>("Entri Nilai", {
    fields: ["siswa", "mata_pelajaran", "predikat", "is_remedial"],
    filters: [["siswa", "in", rosterIds.length ? rosterIds : ["__none__"]]],
    limit_page_length: 0,
  });
  const riskFlags = collectRiskFlags(entriQuery.data ?? []);

  if (rombelQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-fg">Memuat kelas…</div>;
  }

  if (res.kind === "none") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Wali Kelas" title="Kelasku" />
        <SectionCard title="Belum ada kelas">
          <div className="py-2 text-sm text-muted-fg">
            Anda belum ditugaskan sebagai wali kelas aktif. Hubungi Tata Usaha untuk penugasan.
          </div>
        </SectionCard>
      </div>
    );
  }

  const active = res.kind === "one" ? res.rombel : res.active;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wali Kelas"
        title={`Kelasku — ${active.nama_rombel ?? active.name}`}
        description="Roster kelas Anda. Presensi, risiko, dan catatan menyusul."
      />

      {res.kind === "many" ? (
        <div className="flex flex-wrap gap-2">
          {res.rombels.map((rb) => (
            <Button
              key={rb.name}
              size="sm"
              variant="outline"
              className={rb.name === active.name ? "border-brand bg-brand/10 text-brand" : ""}
              onClick={() => setPreferred(rb.name)}
            >
              {rb.nama_rombel ?? rb.name}
            </Button>
          ))}
        </div>
      ) : null}

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <span>Roster</span>
            <Badge tone="neutral">{roster.length}</Badge>
          </span>
        }
        description="Siswa aktif, urut nomor presensi."
      >
        {docQuery.isLoading ? (
          <div className="py-2 text-sm text-muted-fg">Memuat roster…</div>
        ) : roster.length === 0 ? (
          <div className="py-2 text-sm text-muted-fg">Belum ada anggota di kelas ini.</div>
        ) : (
          <ul className="divide-y divide-border">
            {roster.map((a) => (
              <li key={a.siswa} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-semibold tabular-nums text-brand">
                  {a.no_urut ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{a.siswa}</span>
                <Button size="sm" variant="outline" onClick={() => setSheetSiswa(a.siswa)}>
                  Hubungi
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Hadir Hari Ini" description={`Presensi ${today}.`}>
        {absensiList.isLoading ? (
          <div className="py-2 text-sm text-muted-fg">Memuat presensi…</div>
        ) : !diabsen ? (
          <div className="py-2 text-sm text-amber-600">
            Belum diabsen hari ini.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {PRESENCE_STATUSES.map((s) => (
                <div key={s.key} className="rounded-md border border-border bg-bg px-2 py-2 text-center">
                  <div className="text-lg font-semibold tabular-nums text-fg">{presence[s.key]}</div>
                  <div className="text-xs text-muted-fg">{s.label}</div>
                </div>
              ))}
            </div>
            {presence.absent.length > 0 ? (
              <div className="text-sm text-rose-600">
                Alpa: {presence.absent.join(", ")}
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <span>Antrean Perhatian</span>
            <Badge tone={riskFlags.length === 0 ? "success" : "warning"}>{riskFlags.length}</Badge>
          </span>
        }
        description="Siswa dengan nilai D atau remedial."
      >
        {entriQuery.isLoading ? (
          <div className="py-2 text-sm text-muted-fg">Memuat nilai…</div>
        ) : riskFlags.length === 0 ? (
          <div className="py-2 text-sm text-muted-fg">Tidak ada siswa berisiko akademik.</div>
        ) : (
          <ul className="divide-y divide-border">
            {riskFlags.map((f) => (
              <li key={f.siswa} className="py-2 text-sm">
                <span className="font-medium text-fg">{f.siswa}</span>
                <span className="ml-2 text-xs text-amber-600">{f.reasons.join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <CatatanWaliPanel
        rombel={active.name}
        sekolah={sekolah}
        siswaOptions={rosterIds}
      />

      <StudentSheet
        open={!!sheetSiswa}
        onClose={() => setSheetSiswa(null)}
        siswa={sheetSiswa ?? ""}
        rombel={active.name}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/kelas/saya")({
  component: KelaskuPage,
});

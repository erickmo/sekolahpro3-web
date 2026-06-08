/**
 * Kelasku — the Wali Kelas cockpit (/kelas/saya). The /kelas index redirects a
 * homeroom teacher here.
 *
 * Phase 3 shell (read-only): self-resolves the wali's own active rombel from the
 * session user, shows a seat-ordered roster, and a class switcher when the wali
 * owns more than one. Presence / risk flags / one-tap Hubungi Wali and the
 * Catatan Wali quick-notes store need backend wiring (Rekap Absensi report +
 * Catatan Wali doctype) and are marked pending here — the cockpit never shows
 * fabricated numbers (honest empty-states, audit graft from C1).
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useResourceList, useResourceDoc } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Badge, Button } from "@sekolahpro/ui";
import {
  resolveKelasku,
  sortRoster,
  type KelaskuRombel,
  type KelaskuAnggota,
} from "../lib/kelasku";

interface RombelDoc extends KelaskuRombel {
  anggota?: KelaskuAnggota[];
}

function KelaskuPage() {
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
  const res = resolveKelasku(rombelQuery.data ?? [], preferred);
  const activeName = res.kind === "none" ? "" : res.kind === "one" ? res.rombel.name : res.active.name;

  const docQuery = useResourceDoc<RombelDoc>("Rombongan Belajar", activeName);
  const roster = sortRoster(docQuery.data?.anggota ?? []);

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
                <span className="min-w-0 truncate font-medium text-fg">{a.siswa}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Presensi · Risiko · Catatan Wali">
        <div className="py-2 text-sm text-muted-fg">
          Strip presensi hari ini, antrean perhatian (reuse laporan Rekap Absensi Siswa), dan
          Catatan Wali menyusul pada fase backend.
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/kelas/saya")({
  component: KelaskuPage,
});

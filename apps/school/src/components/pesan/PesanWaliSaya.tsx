/**
 * PesanWaliSaya — the Guru's "Pesan Wali" surface (Pesan index redirect target for
 * primary role `guru`).
 *
 * Design intent (Guru tournament winner): a teacher has no inbox to triage — messages to
 * a wali are born on the teaching surface (roster row, Alpa list, Antrean Perhatian) and
 * tracked as a 2-way "Pesan Wali" thread. That full flow needs the `Pesan Wali` doctype
 * (separate Frappe repo) for the thread + status lifecycle, so this phase-1 entry routes
 * the teacher to where the work begins (Kelas Saya roster) and is honest about what is not
 * yet wired, rather than faking a thread. The dispatch envelope (buildPesanWaliPayload) and
 * role surface are already in place for when the doctype lands.
 */
import { Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionCard, IconChat, IconUsers, IconClock } from "@sekolahpro/ui";

/** Brand button styling reused for a TanStack Link CTA (Button has no asChild/to prop). */
const LINK_BUTTON =
  "inline-flex items-center justify-center rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

export function PesanWaliSaya() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Komunikasi Wali"
        title="Pesan Wali"
        description="Hubungi wali murid Anda langsung dari kelas — bukan dari kotak masuk umum."
      />

      <SectionCard
        title="Mulai dari kelas Anda"
        description="Pesan ke wali lahir dari pengamatan di kelas: ketidakhadiran, PR, atau nilai yang perlu perhatian."
      >
        <div className="flex flex-col gap-4">
          <ul className="space-y-3 text-sm text-fg">
            <li className="flex items-start gap-2">
              <span className="h-4 w-4 mt-0.5 text-brand shrink-0"><IconUsers /></span>
              Pilih murid dari daftar kelas, lalu kirim pesan ke wali-nya dalam dua ketukan.
            </li>
            <li className="flex items-start gap-2">
              <span className="h-4 w-4 mt-0.5 text-brand shrink-0"><IconChat /></span>
              Satu catatan bisa dikirim ke satu wali atau ke seluruh wali rombel sekaligus.
            </li>
            <li className="flex items-start gap-2">
              <span className="h-4 w-4 mt-0.5 text-brand shrink-0"><IconClock /></span>
              Lacak balasan wali di daftar Tindak Lanjut Saya — pesan yang masih menunggu jawaban.
            </li>
          </ul>
          <div>
            <Link to="/sch/$sekolah/kelas/saya" params={{ sekolah }} className={LINK_BUTTON}>
              Buka Kelas Saya
            </Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tindak Lanjut Saya">
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center">
          <p className="text-sm font-medium text-fg">Menunggu aktivasi server</p>
          <p className="mt-1 text-xs text-muted-fg">
            Riwayat percakapan dua arah dengan wali aktif setelah doctype
            <code className="mx-1 rounded bg-muted px-1">Pesan Wali</code>
            dipasang di backend. Saat ini pesan ke wali dikirim via WhatsApp dari halaman kelas.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

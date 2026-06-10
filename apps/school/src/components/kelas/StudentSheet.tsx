/**
 * StudentSheet — per-student slide-over for the Wali Kelas cockpit. Fetches the
 * Siswa doc (wali child inline), offers one-tap "Hubungi Wali" via WhatsApp /
 * telephone deep-links from the primary wali's no_hp, and (when the host passes
 * the active rombel) embeds the roster-inline PesanWaliComposer — the tracked
 * 2-way "Pesan Wali" thread, born here instead of an inbox.
 */
import { useResourceDoc } from "@sekolahpro/api-client";
import { Modal, Badge } from "@sekolahpro/ui";
import { pickWaliContact, waLink, telLink, type WaliRow } from "../../lib/kelasku";
import { PesanWaliComposer } from "../pesan/PesanWaliComposer";

interface SiswaDoc {
  nama_lengkap?: string;
  wali?: WaliRow[];
}

export interface StudentSheetProps {
  open: boolean;
  onClose: () => void;
  siswa: string;
  /** Active Rombongan Belajar doc name — when set, the Pesan Wali composer is shown
   * (only the homeroom cockpit passes it; other hosts stay contact-only). */
  rombel?: string;
}

export function StudentSheet({ open, onClose, siswa, rombel }: StudentSheetProps) {
  const doc = useResourceDoc<SiswaDoc>("Siswa", open ? siswa : "");
  const wali = doc.data?.wali ?? [];
  const contact = pickWaliContact(wali);

  return (
    <Modal open={open} onClose={onClose} title={doc.data?.nama_lengkap ?? siswa}>
      <div className="space-y-4">
        {doc.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat data siswa…</div>
        ) : (
          <>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Wali Murid</div>
              {wali.length === 0 ? (
                <div className="mt-1 text-sm text-muted-fg">Belum ada data wali.</div>
              ) : (
                <ul className="mt-1 space-y-1">
                  {wali.map((w, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-fg">{w.nama ?? "—"}</span>
                      {w.hubungan ? <Badge tone="neutral">{w.hubungan}</Badge> : null}
                      {w.is_primary ? <Badge tone="success">Utama</Badge> : null}
                      {w.no_hp ? <span className="text-xs text-muted-fg">{w.no_hp}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {contact?.no_hp ? (
              <div className="flex gap-2">
                <a
                  href={waLink(contact.no_hp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-500/20"
                >
                  WhatsApp {contact.nama ? `(${contact.nama})` : ""}
                </a>
                <a
                  href={telLink(contact.no_hp)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-brand/5"
                >
                  Telepon
                </a>
              </div>
            ) : (
              <div className="text-sm text-muted-fg">Tidak ada nomor wali untuk dihubungi.</div>
            )}

            {rombel ? (
              <div className="border-t border-border pt-4">
                <PesanWaliComposer siswa={siswa} rombel={rombel} waliPhone={contact?.no_hp} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

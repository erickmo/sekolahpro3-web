/**
 * AntreanKeputusan — the left pane of the Kepsek "Meja Persetujuan": the queue of
 * Mutasi Siswa at workflow_state "Pending Kepsek". Per the real workflow this
 * queue is intrinsically DESTRUCTIVE-ONLY (Pindah Keluar + Drop Out escalate to
 * Kepsek; Naik/Tinggal are finalized by Ka-TU) — so every row is danger-flagged
 * and reviewed one-at-a-time (audit B1: no bulk approve).
 *
 * Presentational only: the container fetches the rows and owns selection.
 */
import { SectionCard, Badge } from "@sekolahpro/ui";
import { isDestructiveJenis } from "../../lib/mutasiConstants";

/** A Mutasi Siswa row as the Kepsek queue + review card consume it. */
export interface MutasiQueueRow {
  name: string;
  siswa: string;
  jenis_mutasi: string;
  rombel_asal?: string;
  rombel_tujuan?: string;
  tanggal_efektif?: string;
  alasan?: string;
  workflow_state?: string;
}

export interface AntreanKeputusanProps {
  items: readonly MutasiQueueRow[];
  selectedName?: string | undefined;
  onSelect: (name: string) => void;
}

export function AntreanKeputusan({ items, selectedName, onSelect }: AntreanKeputusanProps) {
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Antrean Persetujuan</span>
          <Badge tone={items.length === 0 ? "success" : "warning"}>{items.length}</Badge>
        </span>
      }
      description="Mutasi menunggu persetujuan Kepala Sekolah."
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-muted-fg">Tidak ada yang menunggu persetujuan.</div>
      ) : (
        <ul className="space-y-1">
          {items.map((m) => {
            const destructive = isDestructiveJenis(m.jenis_mutasi);
            const selected = m.name === selectedName;
            return (
              <li key={m.name}>
                <button
                  type="button"
                  onClick={() => onSelect(m.name)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-brand bg-brand/5"
                      : "border-border bg-bg hover:border-brand/40 hover:bg-brand/5"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-fg">{m.siswa}</span>
                    <span className="block truncate text-xs text-muted-fg">{m.jenis_mutasi}</span>
                  </span>
                  {destructive ? (
                    <Badge tone="danger">Destruktif</Badge>
                  ) : (
                    <Badge tone="neutral">{m.jenis_mutasi}</Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

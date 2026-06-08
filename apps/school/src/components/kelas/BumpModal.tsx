/**
 * BumpModal — manual-select overflow removal for an over-capacity rombel. Lists
 * the rombel's Aktif anggota; the TU checks who to move out and confirms, calling
 * `pindahkan_kelebihan` (which flips those anggota to Keluar — never Siswa.status,
 * audit C7). Bumped students re-surface in the orphan tray for re-placement.
 */
import { useState } from "react";
import { useResourceDoc, useFrappeMutation } from "@sekolahpro/api-client";
import { Modal, Button } from "@sekolahpro/ui";
import { sortRoster, type KelaskuAnggota } from "../../lib/kelasku";

const PINDAHKAN_KELEBIHAN = "sekolahpro.siswa.api.kelas_board.pindahkan_kelebihan";

interface RombelDoc {
  nama_rombel?: string;
  kapasitas?: number;
  anggota?: KelaskuAnggota[];
}

export interface BumpModalProps {
  open: boolean;
  onClose: () => void;
  rombel: string;
  /** Called after a successful removal so the board refetches. */
  onDone: () => void;
}

export function BumpModal({ open, onClose, rombel, onDone }: BumpModalProps) {
  const doc = useResourceDoc<RombelDoc>("Rombongan Belajar", open ? rombel : "");
  const roster = sortRoster(doc.data?.anggota ?? []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pindahkan = useFrappeMutation<{ rombel: string; siswa_keluar: string }>(PINDAHKAN_KELEBIHAN);

  function toggle(siswa: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(siswa)) next.delete(siswa);
      else next.add(siswa);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) return;
    await pindahkan.mutateAsync({ rombel, siswa_keluar: JSON.stringify([...selected]) });
    setSelected(new Set());
    onDone();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Keluarkan dari ${doc.data?.nama_rombel ?? rombel}`}>
      <div className="space-y-3">
        <p className="text-sm text-muted-fg">
          Pilih siswa yang dikeluarkan dari rombel ini (kapasitas {doc.data?.kapasitas ?? "—"}).
          Mereka akan muncul kembali di tray Belum Berkelas.
        </p>
        {doc.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat anggota…</div>
        ) : (
          <ul className="max-h-64 overflow-auto divide-y divide-border rounded-md border border-border">
            {roster.map((a) => (
              <li key={a.siswa} className="flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(a.siswa)}
                  onChange={() => toggle(a.siswa)}
                />
                <span className="tabular-nums text-muted-fg">{a.no_urut ?? "—"}.</span>
                <span className="min-w-0 truncate">{a.siswa}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button disabled={selected.size === 0 || pindahkan.isPending} onClick={submit}>
            {pindahkan.isPending ? "Memproses…" : `Keluarkan (${selected.size})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

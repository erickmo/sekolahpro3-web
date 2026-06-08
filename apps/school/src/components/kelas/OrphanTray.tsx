/**
 * OrphanTray — the "Belum Berkelas" fix-it tray for the TU Papan Kelas. Lists
 * active students not yet placed in any rombel for the selected tahun ajaran
 * (via the `siswa_belum_berkelas` endpoint) and places them inline with
 * `tempatkan_anggota`. The endpoint + controller method enforce capacity; on
 * success the parent refetches so the board + DefectGate update.
 */
import { useEffect, useState } from "react";
import { frappeFetch, useFrappeMutation } from "@sekolahpro/api-client";
import { SectionCard, Badge, Button } from "@sekolahpro/ui";

const SISWA_BELUM_BERKELAS = "sekolahpro.siswa.api.kelas_board.siswa_belum_berkelas";
const TEMPATKAN_ANGGOTA = "sekolahpro.siswa.api.kelas_board.tempatkan_anggota";

interface OrphanRow {
  name: string;
  nama_lengkap?: string;
}

export interface OrphanTrayOption {
  name: string;
  nama_rombel?: string;
}

export interface OrphanTrayProps {
  sekolah: string;
  tahunAjaran: string;
  rombelOptions: readonly OrphanTrayOption[];
  /** Called after a successful placement so the parent can refetch the board. */
  onPlaced: () => void;
}

export function OrphanTray({ sekolah, tahunAjaran, rombelOptions, onPlaced }: OrphanTrayProps) {
  const [orphans, setOrphans] = useState<OrphanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<Record<string, string>>({});
  const place = useFrappeMutation<{ rombel: string; siswa: string }>(TEMPATKAN_ANGGOTA);

  async function load() {
    if (!sekolah || !tahunAjaran) return;
    setLoading(true);
    try {
      const rows = (await frappeFetch(SISWA_BELUM_BERKELAS, {
        sekolah,
        tahun_ajaran: tahunAjaran,
      })) as OrphanRow[] | null;
      setOrphans(rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // reload whenever the scoped TA changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekolah, tahunAjaran]);

  async function placeOrphan(siswa: string) {
    const rombel = target[siswa];
    if (!rombel) return;
    await place.mutateAsync({ rombel, siswa });
    await load();
    onPlaced();
  }

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Belum Berkelas</span>
          <Badge tone={orphans.length === 0 ? "success" : "warning"}>{orphans.length}</Badge>
        </span>
      }
      description="Siswa aktif tanpa rombel di TA ini."
    >
      {loading ? (
        <div className="py-2 text-sm text-muted-fg">Memuat…</div>
      ) : orphans.length === 0 ? (
        <div className="py-2 text-sm text-muted-fg">Semua siswa sudah berkelas.</div>
      ) : (
        <ul className="divide-y divide-border">
          {orphans.map((o) => (
            <li key={o.name} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate font-medium text-fg">{o.nama_lengkap ?? o.name}</span>
              <span className="flex shrink-0 items-center gap-1">
                <select
                  value={target[o.name] ?? ""}
                  onChange={(e) => setTarget((t) => ({ ...t, [o.name]: e.target.value }))}
                  className="rounded-md border border-border bg-bg px-1.5 py-1 text-xs"
                >
                  <option value="">— rombel —</option>
                  {rombelOptions.map((r) => (
                    <option key={r.name} value={r.name}>{r.nama_rombel ?? r.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!target[o.name] || place.isPending}
                  onClick={() => placeOrphan(o.name)}
                >
                  Tempatkan
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

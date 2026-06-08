/**
 * RolloverDrawer — year-rollover (Bulk Naik Kelas) for the TU. A thin wrapper over
 * the EXISTING whitelisted endpoints `get_siswa_aktif` / `proses_bulk_naik_kelas`
 * (no new backend): pick source rombel + source/target TA + target rombel, toggle
 * any students to "tinggal", and process. The endpoint generates auditable Mutasi
 * Siswa docs. Payload shaping is delegated to the tested {@link buildRolloverPayload}.
 */
import { useState } from "react";
import { frappeFetch, useFrappeMutation } from "@sekolahpro/api-client";
import { Modal, Button, Badge } from "@sekolahpro/ui";
import { buildRolloverPayload } from "../../lib/rollover";

const GET_SISWA_AKTIF = "sekolahpro.siswa.page.bulk_naik_kelas.bulk_naik_kelas.get_siswa_aktif";
const PROSES_BULK = "sekolahpro.siswa.page.bulk_naik_kelas.bulk_naik_kelas.proses_bulk_naik_kelas";

interface SiswaAktif {
  siswa: string;
  nama?: string;
  no_urut?: number;
}

export interface RolloverOption {
  name: string;
  nama_rombel?: string;
}

export interface RolloverDrawerProps {
  open: boolean;
  onClose: () => void;
  rombelOptions: readonly RolloverOption[];
  taOptions: readonly { name: string; nama?: string }[];
  defaultTaAsal?: string;
}

export function RolloverDrawer({
  open,
  onClose,
  rombelOptions,
  taOptions,
  defaultTaAsal,
}: RolloverDrawerProps) {
  const [rombelAsal, setRombelAsal] = useState("");
  const [taAsal, setTaAsal] = useState(defaultTaAsal ?? "");
  const [taTujuan, setTaTujuan] = useState("");
  const [rombelTujuan, setRombelTujuan] = useState("");
  const [students, setStudents] = useState<SiswaAktif[]>([]);
  const [tinggal, setTinggal] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const proses = useFrappeMutation<{
    rombel_asal: string;
    tahun_ajaran_asal: string;
    tahun_ajaran_tujuan: string;
    rombel_tujuan: string;
    siswa_naik: string;
    siswa_tinggal: string;
  }>(PROSES_BULK);

  async function loadStudents(rombel: string) {
    setRombelAsal(rombel);
    setStudents([]);
    setTinggal(new Set());
    setResult(null);
    if (!rombel) return;
    setLoading(true);
    try {
      const rows = (await frappeFetch(GET_SISWA_AKTIF, { rombel })) as SiswaAktif[] | null;
      setStudents(rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  function toggleTinggal(siswa: string) {
    setTinggal((prev) => {
      const next = new Set(prev);
      if (next.has(siswa)) next.delete(siswa);
      else next.add(siswa);
      return next;
    });
  }

  async function submit() {
    const payload = buildRolloverPayload(
      students.map((s) => s.siswa),
      tinggal,
    );
    const res = (await proses.mutateAsync({
      rombel_asal: rombelAsal,
      tahun_ajaran_asal: taAsal,
      tahun_ajaran_tujuan: taTujuan,
      rombel_tujuan: rombelTujuan,
      siswa_naik: JSON.stringify(payload.siswa_naik),
      siswa_tinggal: JSON.stringify(payload.siswa_tinggal),
    })) as { created?: number };
    setResult(`${res.created ?? 0} mutasi dibuat (${payload.siswa_naik.length} naik, ${payload.siswa_tinggal.length} tinggal).`);
  }

  const canSubmit =
    !!rombelAsal && !!taAsal && !!taTujuan && !!rombelTujuan && students.length > 0 && !proses.isPending;

  const selectCls = "rounded-md border border-border bg-bg px-2 py-1.5 text-sm";

  return (
    <Modal open={open} onClose={onClose} title="Naik Kelas (Rollover)" size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Rombel Asal</span>
            <select value={rombelAsal} onChange={(e) => loadStudents(e.target.value)} className={selectCls}>
              <option value="">— pilih —</option>
              {rombelOptions.map((r) => (
                <option key={r.name} value={r.name}>{r.nama_rombel ?? r.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Rombel Tujuan</span>
            <select value={rombelTujuan} onChange={(e) => setRombelTujuan(e.target.value)} className={selectCls}>
              <option value="">— pilih —</option>
              {rombelOptions.map((r) => (
                <option key={r.name} value={r.name}>{r.nama_rombel ?? r.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">TA Asal</span>
            <select value={taAsal} onChange={(e) => setTaAsal(e.target.value)} className={selectCls}>
              <option value="">— pilih —</option>
              {taOptions.map((t) => (
                <option key={t.name} value={t.name}>{t.nama ?? t.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">TA Tujuan</span>
            <select value={taTujuan} onChange={(e) => setTaTujuan(e.target.value)} className={selectCls}>
              <option value="">— pilih —</option>
              {taOptions.map((t) => (
                <option key={t.name} value={t.name}>{t.nama ?? t.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium">
            <span>Siswa</span>
            <Badge tone="neutral">{students.length}</Badge>
            {tinggal.size > 0 ? <Badge tone="warning">{tinggal.size} tinggal</Badge> : null}
          </div>
          {loading ? (
            <div className="text-sm text-muted-fg">Memuat siswa…</div>
          ) : students.length === 0 ? (
            <div className="text-sm text-muted-fg">Pilih rombel asal untuk memuat siswa.</div>
          ) : (
            <ul className="max-h-64 overflow-auto divide-y divide-border rounded-md border border-border">
              {students.map((s) => {
                const held = tinggal.has(s.siswa);
                return (
                  <li key={s.siswa} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="tabular-nums text-muted-fg">{s.no_urut ?? "—"}.</span>{" "}
                      {s.nama ?? s.siswa}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => toggleTinggal(s.siswa)}>
                      {held ? "Tinggal" : "Naik"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {result ? <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">{result}</div> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {proses.isPending ? "Memproses…" : "Proses Naik Kelas"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * GeneratorModal — "Buat N Rombel se-Tingkat" for the TU Papan Kelas. Creates a
 * batch of rombel ({tingkat}-A..N) for a jenjang with zero-config defaults via
 * the `buat_rombel_batch` endpoint (each insert runs the rombel validate guards).
 */
import { useState } from "react";
import { useFrappeMutation, useResourceList } from "@sekolahpro/api-client";
import { Modal, Button } from "@sekolahpro/ui";

const BUAT_ROMBEL_BATCH = "sekolahpro.siswa.api.kelas_board.buat_rombel_batch";
const DEFAULT_KAPASITAS = 32;

export interface GeneratorModalProps {
  open: boolean;
  onClose: () => void;
  sekolah: string;
  tahunAjaran: string;
  /** Called after a successful batch create so the board refetches. */
  onCreated: () => void;
}

export function GeneratorModal({ open, onClose, sekolah, tahunAjaran, onCreated }: GeneratorModalProps) {
  const jenjangQuery = useResourceList<{ name: string }>("Unit Jenjang", {
    fields: ["name"],
    filters: [["sekolah", "=", sekolah]],
    limit_page_length: 0,
  });
  const jenjangList = jenjangQuery.data ?? [];

  const [jenjang, setJenjang] = useState("");
  const [tingkat, setTingkat] = useState("7");
  const [jumlah, setJumlah] = useState("3");
  const [kapasitas, setKapasitas] = useState(String(DEFAULT_KAPASITAS));
  const [result, setResult] = useState<string | null>(null);

  const batch = useFrappeMutation<{
    sekolah: string;
    tahun_ajaran: string;
    jenjang: string;
    tingkat: string;
    jumlah: string;
    kapasitas: string;
  }>(BUAT_ROMBEL_BATCH);

  async function submit() {
    const res = (await batch.mutateAsync({
      sekolah,
      tahun_ajaran: tahunAjaran,
      jenjang,
      tingkat,
      jumlah,
      kapasitas,
    })) as { created?: string[] };
    setResult(`${res.created?.length ?? 0} rombel dibuat.`);
    onCreated();
  }

  const canSubmit = !!jenjang && Number(jumlah) > 0 && Number(tingkat) > 0 && !batch.isPending;
  const inputCls = "rounded-md border border-border bg-bg px-2 py-1.5 text-sm";

  return (
    <Modal open={open} onClose={onClose} title="Buat Rombel se-Tingkat">
      <div className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-fg">Jenjang</span>
          <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} className={inputCls}>
            <option value="">— pilih —</option>
            {jenjangList.map((j) => (
              <option key={j.name} value={j.name}>{j.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Tingkat</span>
            <input type="number" value={tingkat} onChange={(e) => setTingkat(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Jumlah</span>
            <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-fg">Kapasitas</span>
            <input type="number" value={kapasitas} onChange={(e) => setKapasitas(e.target.value)} className={inputCls} />
          </label>
        </div>
        {result ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
            {result}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {batch.isPending ? "Membuat…" : "Buat Rombel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

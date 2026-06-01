/**
 * GelombangCreateModal — form cepat buat batch Gelombang PPDB baru.
 *
 * Mengumpulkan field minimal (nama, TA, sekolah, tingkat, periode, kuota,
 * biaya) lalu memanggil useResourceCreate("Gelombang PPDB") dengan status awal
 * "Draft". Pemanggil mengaktifkan batch dari daftar setelah konfigurasi siap.
 *
 * HANYA diimpor oleh route sch.$sekolah.ppdb.gelombang.tsx (colocated child).
 */

import { useState, type ReactNode } from "react";
import { Button, DatePicker, Modal } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

const GELOMBANG_DOCTYPE = "Gelombang PPDB";
const STATUS_DRAFT = "Draft";
const ERR_CREATE = "Gagal membuat gelombang.";

// Kelas input dasar — token tema Tailwind, dipakai semua field modal.
const INPUT_CLS =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/** Label + kontrol input vertikal yang konsisten untuk grid form. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

/**
 * Modal buat gelombang. Mereset seluruh field saat ditutup atau sukses agar
 * pembukaan berikutnya selalu mulai dari keadaan bersih.
 */
export function GelombangCreateModal({ open, onClose, onCreated }: Props): ReactNode {
  const [nama, setNama] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [tanggalBuka, setTanggalBuka] = useState("");
  const [tanggalTutup, setTanggalTutup] = useState("");
  const [kuota, setKuota] = useState<string>("");
  const [biaya, setBiaya] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate(GELOMBANG_DOCTYPE);

  /** Kosongkan seluruh field + pesan error ke keadaan awal. */
  const reset = () => {
    setNama(""); setTahunAjaran(""); setSekolah(""); setTingkat("");
    setTanggalBuka(""); setTanggalTutup(""); setKuota(""); setBiaya(""); setErr(null);
  };

  /** Tutup modal dengan mereset field terlebih dahulu. */
  const closeReset = () => { reset(); onClose(); };

  /** Buat gelombang baru berstatus Draft lalu tutup modal saat sukses. */
  const submit = async () => {
    setErr(null);
    try {
      await create.mutateAsync({
        nama,
        tahun_ajaran: tahunAjaran || undefined,
        sekolah: sekolah || undefined,
        tingkat: tingkat || undefined,
        tanggal_buka: tanggalBuka || undefined,
        tanggal_tutup: tanggalTutup || undefined,
        kuota: kuota ? Number(kuota) : undefined,
        biaya_pendaftaran: biaya ? Number(biaya) : undefined,
        status: STATUS_DRAFT,
      });
      reset();
      onCreated();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? ERR_CREATE);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeReset}
      title="Buat Gelombang Baru"
      description="Default status Draft; aktifkan dari daftar setelah konfigurasi selesai."
      size="lg"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeReset}>Batal</Button>
          <Button onClick={submit} disabled={!nama || create.isPending}>
            {create.isPending ? "Membuat..." : "Buat"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama Gelombang *">
          <input value={nama} onChange={(e) => setNama(e.target.value)} className={INPUT_CLS} />
        </Field>
        <Field label="Tahun Ajaran">
          <input value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} className={INPUT_CLS} placeholder="2026-2027" />
        </Field>
        <Field label="Sekolah">
          <input value={sekolah} onChange={(e) => setSekolah(e.target.value)} className={INPUT_CLS} />
        </Field>
        <Field label="Tingkat">
          <input value={tingkat} onChange={(e) => setTingkat(e.target.value)} className={INPUT_CLS} placeholder="mis. 10" />
        </Field>
        <Field label="Tanggal Buka">
          <DatePicker value={tanggalBuka} onChange={setTanggalBuka} className={INPUT_CLS} />
        </Field>
        <Field label="Tanggal Tutup">
          <DatePicker value={tanggalTutup} onChange={setTanggalTutup} className={INPUT_CLS} />
        </Field>
        <Field label="Kuota">
          <input type="number" value={kuota} onChange={(e) => setKuota(e.target.value)} className={INPUT_CLS} />
        </Field>
        <Field label="Biaya Pendaftaran (Rp)">
          <input type="number" value={biaya} onChange={(e) => setBiaya(e.target.value)} className={INPUT_CLS} />
        </Field>
      </div>
      {err && (
        <div className="mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      )}
    </Modal>
  );
}

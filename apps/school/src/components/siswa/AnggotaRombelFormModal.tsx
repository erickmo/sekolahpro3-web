/**
 * AnggotaRombelFormModal — append child row to "Rombongan Belajar".anggota.
 *
 * Anggota Rombel is istable=1 (child of Rombongan Belajar). REST create on the
 * child doctype is not supported standalone; instead fetch the parent rombel,
 * push a new row into its `anggota` array, then PUT the parent.
 */

import { useState } from "react";
import { Button, DatePicker, FormField, FormGrid, Input, Modal, SearchableSelect } from "@sekolahpro/ui";
import { getResource, updateResource, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type RombelRow = { name: string; nama_rombel?: string; tahun_ajaran?: string };
type SiswaRow = { name: string; nama_lengkap?: string; nis?: string };

interface AnggotaRow {
  siswa: string;
  no_urut?: number;
  tanggal_masuk_rombel?: string;
  status?: string;
}

interface ParentDoc {
  name: string;
  anggota?: AnggotaRow[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (rombel: string, siswa: string) => void;
}

interface FormState {
  rombel: string;
  siswa: string;
  no_urut: string;
  tanggal_masuk_rombel: string;
  status: string;
}

const STATUS_OPTIONS = ["Aktif", "Keluar"] as const;

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({
  rombel: "",
  siswa: "",
  no_urut: "",
  tanggal_masuk_rombel: todayISO(),
  status: "Aktif",
});

export function AnggotaRombelFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const qc = useQueryClient();
  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel", "tahun_ajaran"],
    filters: [["status", "=", "Aktif"]],
    limit_page_length: 0,
  });
  const siswaQ = useResourceList<SiswaRow>("Siswa", {
    fields: ["name", "nama_lengkap", "nis"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(initial());
    setErr(null);
  };

  const close = () => {
    if (pending) return;
    reset();
    onClose();
  };

  const canSubmit = !!form.rombel && !!form.siswa && !!form.status && !pending;

  const submit = async () => {
    setErr(null);
    setPending(true);
    try {
      const parent = await getResource<ParentDoc>("Rombongan Belajar", form.rombel);
      const existing = parent.anggota ?? [];
      if (existing.some((r) => r.siswa === form.siswa)) {
        throw new Error("Siswa sudah terdaftar di rombel ini.");
      }
      const row: AnggotaRow = {
        siswa: form.siswa,
        status: form.status,
        tanggal_masuk_rombel: form.tanggal_masuk_rombel || todayISO(),
      };
      if (form.no_urut.trim()) row.no_urut = Number(form.no_urut);

      await updateResource("Rombongan Belajar", form.rombel, {
        anggota: [...existing, row],
      });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Anggota Rombel"] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rombongan Belajar"] });
      await qc.invalidateQueries({ queryKey: ["resource:doc", "Rombongan Belajar", form.rombel] });
      reset();
      if (onCreated) onCreated(form.rombel, form.siswa);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menambah anggota rombel.");
    } finally {
      setPending(false);
    }
  };

  const rombelOpts = rombelQ.data ?? [];
  const siswaOpts = siswaQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Anggota Rombel"
      description="Tambahkan siswa ke rombongan belajar. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={pending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Rombongan Belajar" required>
            <SearchableSelect
              value={form.rombel}
              onChange={(v) => set("rombel", v)}
              disabled={rombelQ.isLoading}
              options={rombelOpts.map((r) => ({
                value: r.name,
                label: r.nama_rombel ? `${r.nama_rombel} (${r.name})` : r.name,
              }))}
              placeholder={rombelQ.isLoading ? "Memuat..." : "— Pilih Rombel —"}
            />
          </FormField>
          <FormField label="Siswa" required>
            <SearchableSelect
              value={form.siswa}
              onChange={(v) => set("siswa", v)}
              disabled={siswaQ.isLoading}
              options={siswaOpts.map((s) => ({
                value: s.name,
                label: s.nama_lengkap ? `${s.nama_lengkap}${s.nis ? ` · ${s.nis}` : ""}` : s.name,
              }))}
              placeholder={siswaQ.isLoading ? "Memuat..." : "— Pilih Siswa —"}
            />
          </FormField>
          <FormField label="No. Urut/Absen">
            <Input
              type="number"
              min={0}
              value={form.no_urut}
              onChange={(e) => set("no_urut", e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Masuk">
            <DatePicker
              value={form.tanggal_masuk_rombel}
              onChange={(v) => set("tanggal_masuk_rombel", v)}
            />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </FormField>
        </FormGrid>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

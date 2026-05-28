/**
 * AnggotaRombelFormModal — create modal untuk CHILD doctype "Anggota Rombel".
 *
 * Child table dari Rombongan Belajar (parentfield = "anggota"). Payload wajib
 * menyertakan parent/parenttype/parentfield untuk dibuat via REST.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";

type RombelRow = { name: string; nama_rombel?: string };
type SiswaRow = { name: string; nama_lengkap?: string };

const STATUS_OPTIONS = ["Aktif", "Keluar"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

export function AnggotaRombelFormModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [parent, setParent] = useState("");
  const [siswa, setSiswa] = useState("");
  const [noUrut, setNoUrut] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>("Anggota Rombel");

  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"],
    limit_page_length: 0,
  });
  const siswaQ = useResourceList<SiswaRow>("Siswa", {
    fields: ["name", "nama_lengkap"],
    limit_page_length: 0,
  });

  const reset = () => {
    setParent("");
    setSiswa("");
    setNoUrut("");
    setTanggal("");
    setStatus("");
    setErr(null);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const requiredMissing = !parent || !siswa;

  const submit = async () => {
    setErr(null);
    const payload: Record<string, unknown> = {
      parent,
      parenttype: "Rombongan Belajar",
      parentfield: "anggota",
      siswa,
    };
    if (noUrut.trim()) {
      const n = Number(noUrut);
      if (!Number.isNaN(n)) payload.no_urut = n;
    }
    if (tanggal) payload.tanggal_masuk_rombel = tanggal;
    if (status) payload.status = status;
    try {
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Anggota Rombel"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat anggota rombel.");
    }
  };

  const rombelRows = rombelQ.data ?? [];
  const siswaRows = siswaQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="lg"
      title="Tambah Anggota Rombel"
      description="Pilih rombel tujuan lalu isi data anggota. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeAll}>
            Batal
          </Button>
          <Button onClick={submit} disabled={requiredMissing || create.isPending}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Rombel" required>
            <SearchableSelect
              value={parent}
              onChange={(v) => setParent(v)}
              options={rombelRows.map((r) => ({
                value: r.name,
                label: `${r.name}${r.nama_rombel ? ` — ${r.nama_rombel}` : ""}`,
              }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Siswa" required>
            <SearchableSelect
              value={siswa}
              onChange={(v) => setSiswa(v)}
              options={siswaRows.map((s) => ({
                value: s.name,
                label: `${s.name}${s.nama_lengkap ? ` — ${s.nama_lengkap}` : ""}`,
              }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="No. Urut">
            <Input
              type="number"
              value={noUrut}
              onChange={(e) => setNoUrut(e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Masuk Rombel">
            <DatePicker
              value={tanggal}
              onChange={(v) => setTanggal(v)}
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              value={status}
              onChange={(v) => setStatus(v)}
              options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="— pilih —"
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

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import { humanizeFrappeError, useResourceCreate } from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

// Expiry dates stay near the present — narrow year range.
const MIN_YEAR = new Date().getFullYear();
const MAX_YEAR = new Date().getFullYear() + 10;

// Exact backend Select values (kartu.json).
const TIPE_OPTIONS = [
  { value: "debit", label: "Debit (terhubung rekening)" },
  { value: "emoney", label: "E-Money (wallet)" },
];
const STATUS_AKTIF = "aktif";
// A debit card MUST be backed by a savings account to settle against.
const TIPE_DEBIT = "debit";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type Form = {
  uid_nfc: string;
  tipe_kartu: string;
  anggota: string;
  rekening_simpanan: string;
  tanggal_expired: string;
};

/**
 * Terbitkan Kartu baru. Backend contract: { uid_nfc*, tipe_kartu*, status*,
 * anggota*, rekening_simpanan?, tanggal_expired? }. Status awal selalu
 * "aktif"; blokir/expired berjalan via aksi di halaman detail.
 */
export function KartuCreateModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<Form>({
    uid_nfc: "",
    tipe_kartu: "debit",
    anggota: "",
    rekening_simpanan: "",
    tanggal_expired: "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const mutation = useResourceCreate<{ name: string }>("Kartu");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.uid_nfc.trim()) errs.uid_nfc = "Wajib";
    if (!form.anggota.trim()) errs.anggota = "Wajib";
    if (form.tipe_kartu === TIPE_DEBIT && !form.rekening_simpanan.trim()) {
      errs.rekening_simpanan = "Wajib untuk kartu debit";
    }
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    const payload: Record<string, unknown> = {
      uid_nfc: form.uid_nfc.trim(),
      tipe_kartu: form.tipe_kartu,
      anggota: form.anggota.trim(),
      status: STATUS_AKTIF,
    };
    if (form.rekening_simpanan) payload["rekening_simpanan"] = form.rekening_simpanan;
    if (form.tanggal_expired) payload["tanggal_expired"] = form.tanggal_expired;
    mutation.mutate(payload, {
      onSuccess: (doc) => {
        void qc.invalidateQueries({ queryKey: ["resource:list", "Kartu"] });
        onCreated?.(doc.name);
        onClose();
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Terbitkan Kartu"
      description="Tautkan UID NFC baru ke anggota koperasi. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={mutation.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {mutation.isPending ? "Menyimpan..." : "Terbitkan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Data Kartu"
          description="UID NFC, tipe, dan anggota pemegang kartu."
        >
          <FormField label="UID NFC" required error={err.uid_nfc}>
            <Input value={form.uid_nfc} onChange={(e) => setForm({ ...form, uid_nfc: e.target.value })} />
          </FormField>
          <FormField label="Tipe Kartu" required>
            <SearchableSelect
              value={form.tipe_kartu}
              onChange={(v) => setForm({ ...form, tipe_kartu: v })}
              options={TIPE_OPTIONS}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Anggota" required error={err.anggota} hint="Anggota Koperasi pemegang kartu">
            <SearchableSelect
              value={form.anggota}
              onChange={(v) => setForm({ ...form, anggota: v })}
              loadOptions={(q) => searchLink("Anggota Koperasi", "nasabah", q)}
              placeholder="Cari anggota…"
            />
          </FormField>
          <FormField label="Rekening Simpanan" hint="Wajib untuk kartu debit" error={err.rekening_simpanan}>
            <SearchableSelect
              value={form.rekening_simpanan}
              onChange={(v) => setForm({ ...form, rekening_simpanan: v })}
              loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
              placeholder="Cari rekening…"
            />
          </FormField>
        </FormSection>
        <FormSection
          title="Masa Berlaku"
          description="Tanggal kedaluwarsa kartu (opsional)."
        >
          <FormField label="Kedaluwarsa">
            <DatePicker
              value={form.tanggal_expired}
              onChange={(v) => setForm({ ...form, tanggal_expired: v })}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>
        {mutation.isError ? (
          <p className="text-xs text-rose-600">
            {humanizeFrappeError(mutation.error) ?? (mutation.error as Error).message}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

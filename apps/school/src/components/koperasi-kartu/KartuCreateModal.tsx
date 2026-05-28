import { useState, type FormEvent } from "react";
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
import { useResourceCreate } from "@sekolahpro/api-client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type Form = {
  uid_rfid: string;
  anggota: string;
  tanggal_terbit: string;
  tanggal_kedaluwarsa: string;
  status: string;
};

export function KartuCreateModal({ open, onClose, onCreated }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<Form>({
    uid_rfid: "",
    anggota: "",
    tanggal_terbit: today,
    tanggal_kedaluwarsa: "",
    status: "Aktif",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const mutation = useResourceCreate<{ name: string }>("Kartu");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.uid_rfid.trim()) errs.uid_rfid = "Wajib";
    if (!form.anggota.trim()) errs.anggota = "Wajib";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    const payload: Record<string, unknown> = {
      uid_rfid: form.uid_rfid.trim(),
      anggota: form.anggota.trim(),
      tanggal_terbit: form.tanggal_terbit,
      status: form.status,
    };
    if (form.tanggal_kedaluwarsa) payload["tanggal_kedaluwarsa"] = form.tanggal_kedaluwarsa;
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
      title="Terbitkan Kartu RFID"
      description="Tautkan UID RFID baru ke anggota koperasi."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={mutation.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {mutation.isPending ? "Menyimpan..." : "Terbitkan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="UID RFID" required error={err.uid_rfid}>
            <Input value={form.uid_rfid} onChange={(e) => setForm({ ...form, uid_rfid: e.target.value })} />
          </FormField>
          <FormField label="Anggota" required error={err.anggota} hint="No. Anggota Koperasi">
            <Input value={form.anggota} onChange={(e) => setForm({ ...form, anggota: e.target.value })} />
          </FormField>
          <FormField label="Tanggal Terbit" required>
            <DatePicker value={form.tanggal_terbit} onChange={(v) => setForm({ ...form, tanggal_terbit: v })} required />
          </FormField>
          <FormField label="Kedaluwarsa">
            <DatePicker value={form.tanggal_kedaluwarsa} onChange={(v) => setForm({ ...form, tanggal_kedaluwarsa: v })} />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={["Aktif", "Blokir", "Hilang", "Kedaluwarsa"].map((s) => ({ value: s, label: s }))}
            />
          </FormField>
        </FormGrid>
        {mutation.isError ? (
          <p className="text-xs text-rose-600">{(mutation.error as Error).message}</p>
        ) : null}
      </form>
    </Modal>
  );
}

/**
 * PesanComposeModal — log a new entry into "Contact Inbox SekolahPro".
 *
 * Use case: petugas mencatat pertanyaan walk-in / telepon / WA agar masuk
 * inbox dan bisa di-track status (Baru → Dibalas → Selesai).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select, Textarea } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTIONS = ["Baru", "Dibalas", "Selesai"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama: string;
  email: string;
  telepon: string;
  pesan: string;
  status: string;
}

const initial = (): FormState => ({
  nama: "",
  email: "",
  telepon: "",
  pesan: "",
  status: "Baru",
});

export function PesanComposeModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Contact Inbox SekolahPro");

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(initial());
    setErr(null);
  };

  const close = () => {
    if (create.isPending) return;
    reset();
    onClose();
  };

  const canSubmit =
    !!form.nama.trim() &&
    !!form.email.trim() &&
    !!form.pesan.trim() &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama.trim(),
        email: form.email.trim(),
        pesan: form.pesan.trim(),
        status: form.status,
      };
      if (form.telepon.trim()) payload.telepon = form.telepon.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Contact Inbox SekolahPro"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan pesan.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Pesan Baru"
      description="Catat pesan masuk (walk-in / telepon / WA) ke inbox kontak."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={create.isPending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Nama" required>
            <Input
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Nama pengirim"
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@example.com"
            />
          </FormField>
          <FormField label="Telepon">
            <Input
              value={form.telepon}
              onChange={(e) => set("telepon", e.target.value)}
              placeholder="08xx"
            />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
        </FormGrid>

        <FormField label="Pesan" required>
          <Textarea
            rows={6}
            value={form.pesan}
            onChange={(e) => set("pesan", e.target.value)}
            placeholder="Isi pesan..."
          />
        </FormField>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

// Card issue/expiry dates stay near the present — narrow year range.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

const STATUS_OPTIONS = ["Aktif", "Blokir", "Hilang", "Kedaluwarsa"];

/** Async option loader for a Frappe link field. */
async function searchLink(
  doctype: string,
  labelField: string,
  q: string,
): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q
      ? {
          or_filters: [
            ["name", "like", `%${q}%`],
            [labelField, "like", `%${q}%`],
          ] as [string, string, unknown][],
        }
      : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? ""),
  }));
}

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-fg mt-0.5">{description}</p>
        ) : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

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
      description="Tautkan UID RFID baru ke anggota koperasi. Tanda * wajib diisi."
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
          description="UID RFID dan anggota pemegang kartu."
        >
          <FormField label="UID RFID" required error={err.uid_rfid}>
            <Input value={form.uid_rfid} onChange={(e) => setForm({ ...form, uid_rfid: e.target.value })} />
          </FormField>
          <FormField label="Anggota" required error={err.anggota} hint="Anggota Koperasi pemegang kartu">
            <SearchableSelect
              value={form.anggota}
              onChange={(v) => setForm({ ...form, anggota: v })}
              loadOptions={(q) => searchLink("Anggota Koperasi", "nasabah", q)}
              placeholder="Cari anggota…"
            />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              placeholder="— pilih —"
            />
          </FormField>
        </FormSection>
        <FormSection
          title="Masa Berlaku"
          description="Tanggal terbit dan kedaluwarsa kartu."
        >
          <FormField label="Tanggal Terbit" required>
            <DatePicker
              value={form.tanggal_terbit}
              onChange={(v) => setForm({ ...form, tanggal_terbit: v })}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Kedaluwarsa">
            <DatePicker
              value={form.tanggal_kedaluwarsa}
              onChange={(v) => setForm({ ...form, tanggal_kedaluwarsa: v })}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>
        {mutation.isError ? (
          <p className="text-xs text-rose-600">{(mutation.error as Error).message}</p>
        ) : null}
      </form>
    </Modal>
  );
}

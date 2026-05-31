/**
 * UtilitasGedungFormModal — create/edit modal untuk doctype "Utilitas Gedung".
 *
 * Autoname backend: format:{gedung}-{jenis}. Field wajib: gedung, jenis, status.
 * defaultGedung: kunci konteks gedung (select Gedung/Sekolah disembunyikan).
 * editName: mode edit (gedung tidak diubah).
 */

import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  listResource,
  useResourceCreate,
  useResourceDoc,
  useResourceUpdate,
} from "@sekolahpro/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  defaultGedung?: string;
  editName?: string;
};

const JENIS_OPTIONS = ["Listrik", "Air", "Internet", "Gas", "Lainnya"] as const;
const STATUS_OPTIONS = ["Aktif", "Nonaktif"] as const;

function toOptions(values: readonly string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

/** Async option loader for a Frappe link field. */
async function searchLink(doctype: string, labelField: string, q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], [labelField, "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name ?? "", label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? "") }));
}

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({ title, description, children }: { title: string; description?: string | undefined; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

type FormState = {
  gedung: string;
  sekolah: string;
  jenis: string;
  provider: string;
  kapasitas: string;
  satuan: string;
  nomor_pelanggan: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  gedung: "",
  sekolah: "",
  jenis: "",
  provider: "",
  kapasitas: "",
  satuan: "",
  nomor_pelanggan: "",
  status: "Aktif",
};

export function UtilitasGedungFormModal({ open, onClose, onCreated, defaultGedung, editName }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, gedung: defaultGedung ?? "" });
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate<{ name: string }>("Utilitas Gedung");
  const update = useResourceUpdate<{ name: string }>("Utilitas Gedung");
  const docQ = useResourceDoc<Record<string, unknown>>("Utilitas Gedung", editName, { enabled: !!editName });

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        gedung: `${d.gedung ?? defaultGedung ?? ""}`,
        sekolah: `${d.sekolah ?? ""}`,
        jenis: `${d.jenis ?? ""}`,
        provider: `${d.provider ?? ""}`,
        kapasitas: `${d.kapasitas ?? ""}`,
        satuan: `${d.satuan ?? ""}`,
        nomor_pelanggan: `${d.nomor_pelanggan ?? ""}`,
        status: `${d.status ?? "Aktif"}`,
      });
    } else if (!editName && defaultGedung) {
      setForm((c) => ({ ...c, gedung: defaultGedung }));
    }
  }, [docQ.data, defaultGedung, editName]);

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm({ ...EMPTY_FORM, gedung: defaultGedung ?? "" });
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const requiredOk = (!!form.gedung || !!editName) && !!form.jenis && !!form.status;
  const pending = create.isPending || update.isPending;
  const submitDisabled = !requiredOk || pending;

  const submit = async () => {
    setErr(null);
    const patch: Record<string, string> = { jenis: form.jenis, status: form.status };
    if (form.provider) patch.provider = form.provider;
    if (form.kapasitas) patch.kapasitas = form.kapasitas;
    if (form.satuan) patch.satuan = form.satuan;
    if (form.nomor_pelanggan) patch.nomor_pelanggan = form.nomor_pelanggan;
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch })).name;
      } else {
        const createPayload: Record<string, string> = { ...patch, gedung: form.gedung };
        if (form.sekolah) createPayload.sekolah = form.sekolah;
        name = (await create.mutateAsync(createPayload)).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      reset();
      onCreated?.(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan utilitas.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title={editName ? "Edit Utilitas" : "Tambah Utilitas"}
      description="Catat utilitas (listrik, air, internet, dsb) untuk satu gedung. Tanda * wajib diisi."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={submitDisabled}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Penempatan & Jenis" description="Gedung pemilik utilitas serta jenis dan statusnya.">
          {!defaultGedung && (
            <FormField label="Gedung" required>
              <SearchableSelect
                value={form.gedung}
                onChange={(v) => set("gedung", v)}
                loadOptions={(q) => searchLink("Gedung", "nama", q)}
                placeholder="Cari gedung…"
              />
            </FormField>
          )}

          {!defaultGedung && (
            <FormField label="Sekolah">
              <SearchableSelect
                value={form.sekolah}
                onChange={(v) => set("sekolah", v)}
                loadOptions={(q) => searchLink("Sekolah", "nama_sekolah", q)}
                placeholder="Cari sekolah…"
              />
            </FormField>
          )}

          <FormField label="Jenis" required htmlFor="utilitas-jenis">
            <SearchableSelect
              id="utilitas-jenis"
              value={form.jenis}
              onChange={(v) => set("jenis", v)}
              options={toOptions(JENIS_OPTIONS)}
              placeholder="— pilih —"
            />
          </FormField>

          <FormField label="Status" required htmlFor="utilitas-status">
            <SearchableSelect
              id="utilitas-status"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={toOptions(STATUS_OPTIONS)}
              placeholder="— pilih —"
            />
          </FormField>
        </FormSection>

        <FormSection title="Detail Langganan" description="Informasi penyedia dan kapasitas (opsional).">
          <FormField label="Provider">
            <Input
              aria-label="Provider"
              value={form.provider}
              onChange={(e) => set("provider", e.target.value)}
              placeholder="PLN, PDAM, Telkom, dsb"
            />
          </FormField>

          <FormField label="Nomor Pelanggan">
            <Input
              aria-label="Nomor Pelanggan"
              value={form.nomor_pelanggan}
              onChange={(e) => set("nomor_pelanggan", e.target.value)}
            />
          </FormField>

          <FormField label="Kapasitas">
            <Input
              aria-label="Kapasitas"
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              placeholder="mis. 2200"
            />
          </FormField>

          <FormField label="Satuan">
            <Input
              aria-label="Satuan"
              value={form.satuan}
              onChange={(e) => set("satuan", e.target.value)}
              placeholder="VA, Mbps, m3, dsb"
            />
          </FormField>
        </FormSection>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

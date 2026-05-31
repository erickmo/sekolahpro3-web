import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  humanizeFrappeError,
  listResource,
  useResourceCreate,
  useResourceDoc,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";

interface LantaiFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  /** Bila di-set, gedung dikunci ke nilai ini (select disembunyikan). */
  defaultGedung?: string;
  /** Bila di-set → mode edit. */
  editName?: string;
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

export function LantaiFormModal({ open, onClose, onCreated, defaultGedung, editName }: LantaiFormModalProps) {
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Lantai");
  const update = useResourceUpdate<{ name: string }>("Lantai");
  const docQ = useResourceDoc<Record<string, unknown>>("Lantai", editName, { enabled: !!editName });

  const [nama, setNama] = useState("");
  const [nomorLantai, setNomorLantai] = useState("");
  const [gedung, setGedung] = useState(defaultGedung ?? "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setNama(`${d.nama ?? ""}`);
      setNomorLantai(`${d.nomor_lantai ?? ""}`);
      setGedung(`${d.gedung ?? defaultGedung ?? ""}`);
    } else if (!editName && defaultGedung) {
      setGedung(defaultGedung);
    }
  }, [docQ.data, defaultGedung, editName]);

  const reset = () => {
    setNama("");
    setNomorLantai("");
    setGedung(defaultGedung ?? "");
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const canSubmit =
    nama.trim().length > 0 &&
    nomorLantai.trim().length > 0 &&
    gedung.trim().length > 0 &&
    !create.isPending &&
    !update.isPending;

  const submit = async () => {
    setErr(null);
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch: { nama: nama.trim(), nomor_lantai: Number(nomorLantai) } })).name;
      } else {
        name = (await create.mutateAsync({ nama: nama.trim(), nomor_lantai: Number(nomorLantai), gedung })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr(humanizeFrappeError(e) ?? (e as Error)?.message ?? "Gagal menyimpan lantai.");
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title={editName ? "Edit Lantai" : "Tambah Lantai"}
      description="Isi data lantai. Tanda * wajib diisi."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Data Lantai" description="Lantai berada di dalam satu gedung.">
          {!defaultGedung && (
            <FormField label="Gedung" required>
              <SearchableSelect
                value={gedung}
                onChange={(v) => setGedung(v)}
                loadOptions={(q) => searchLink("Gedung", "nama", q)}
                placeholder="Cari gedung…"
              />
            </FormField>
          )}
          <FormField label="Nomor Lantai" required>
            <Input
              aria-label="Nomor Lantai"
              type="number"
              value={nomorLantai}
              onChange={(e) => setNomorLantai(e.target.value)}
              min={0}
            />
          </FormField>
          <FormField label="Nama" required className="col-span-2">
            <Input aria-label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
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

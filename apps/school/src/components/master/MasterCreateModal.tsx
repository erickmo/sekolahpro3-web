import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceUpdate } from "@sekolahpro/api-client";

// Reusable create/edit-form modal for master.* domain. Mirrors PerpCreateModal shape.

// Tahun rentang untuk DatePicker master (data referensi, bukan tanggal lahir):
// dari satu dekade ke belakang hingga satu tahun ke depan.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

export type MasterFieldType = "text" | "number" | "date" | "select" | "textarea" | "checkbox";

export interface MasterFieldDef {
  name: string;
  label: string;
  type: MasterFieldType;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
  disabledOnEdit?: boolean;
  /** Judul section tempat field ini dikelompokkan. Tanpa ini → section default. */
  section?: string;
}

/** Heading section + grid untuk satu kelompok logis field. */
function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
      </div>
      <FormGrid cols={2}>{children}</FormGrid>
    </section>
  );
}

/** Kelompokkan field per `section`; pertahankan urutan kemunculan section. */
function groupBySection<T extends { section?: string }>(
  fields: T[],
  fallbackTitle: string,
): Array<{ title: string; fields: T[] }> {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const f of fields) {
    const key = f.section ?? fallbackTitle;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(f);
  }
  return order.map((title) => ({ title, fields: map.get(title)! }));
}

export interface MasterCreateModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  description?: string;
  fields: MasterFieldDef[];
  submitLabel?: string;
  onSaved?: (doc: Record<string, unknown>) => void;
  // Backwards compat alias
  onCreated?: (doc: Record<string, unknown>) => void;
  mode?: "create" | "edit";
  recordName?: string;
  initialDoc?: Record<string, unknown> | null;
}

function emptyValues(fields: MasterFieldDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "checkbox") {
      out[f.name] = f.defaultValue !== undefined ? String(f.defaultValue) : "0";
    } else {
      out[f.name] = f.defaultValue !== undefined ? String(f.defaultValue) : "";
    }
  }
  return out;
}

function valuesFromDoc(fields: MasterFieldDef[], doc: Record<string, unknown> | null | undefined): Record<string, string> {
  const out = emptyValues(fields);
  if (!doc) return out;
  for (const f of fields) {
    const raw = doc[f.name];
    if (raw === undefined || raw === null) continue;
    if (f.type === "checkbox") {
      out[f.name] = raw ? "1" : "0";
    } else {
      out[f.name] = String(raw);
    }
  }
  return out;
}

export function MasterCreateModal(props: MasterCreateModalProps) {
  const {
    open,
    onClose,
    doctype,
    title,
    description,
    fields,
    submitLabel,
    onSaved,
    onCreated,
    mode = "create",
    recordName,
    initialDoc,
  } = props;
  const isEdit = mode === "edit";
  const [values, setValues] = useState<Record<string, string>>(() =>
    isEdit ? valuesFromDoc(fields, initialDoc) : emptyValues(fields),
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const qc = useQueryClient();
  const create = useResourceCreate(doctype);
  const update = useResourceUpdate(doctype);
  const pending = isEdit ? update.isPending : create.isPending;

  useEffect(() => {
    if (!open) return;
    setValues(isEdit ? valuesFromDoc(fields, initialDoc) : emptyValues(fields));
    setErrMsg(null);
  }, [open, isEdit, initialDoc, fields]);

  const reset = () => {
    setValues(isEdit ? valuesFromDoc(fields, initialDoc) : emptyValues(fields));
    setErrMsg(null);
  };

  const handleClose = () => {
    if (pending) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);

    for (const f of fields) {
      if (f.required && f.type !== "checkbox" && !values[f.name]?.toString().trim()) {
        setErrMsg(`Field "${f.label}" wajib diisi.`);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      if (isEdit && f.disabledOnEdit) continue;
      const raw = values[f.name];
      if (f.type === "checkbox") {
        payload[f.name] = raw === "1" ? 1 : 0;
        continue;
      }
      if (raw === undefined || raw === "") continue;
      if (f.type === "number") {
        const n = Number(raw);
        if (Number.isNaN(n)) {
          setErrMsg(`Field "${f.label}" harus berupa angka.`);
          return;
        }
        payload[f.name] = n;
      } else {
        payload[f.name] = raw;
      }
    }

    try {
      let doc: Record<string, unknown>;
      if (isEdit) {
        if (!recordName) throw new Error("recordName wajib di mode edit.");
        doc = (await update.mutateAsync({ name: recordName, patch: payload })) as Record<string, unknown>;
        qc.invalidateQueries({ queryKey: ["resource:doc", doctype, recordName] });
      } else {
        doc = (await create.mutateAsync(payload)) as Record<string, unknown>;
      }
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      onSaved?.(doc);
      onCreated?.(doc);
      reset();
      onClose();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  };

  const renderField = (f: MasterFieldDef): ReactNode => {
    const id = `master-form-${f.name}`;
    const val = values[f.name] ?? "";
    const onChange = (v: string) => setValues((prev) => ({ ...prev, [f.name]: v }));
    const disabled = isEdit && f.disabledOnEdit ? true : false;

    if (f.type === "checkbox") {
      return (
        <Checkbox
          id={id}
          checked={val === "1"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? "1" : "0")}
        />
      );
    }
    if (f.type === "select" && f.options) {
      return (
        <SearchableSelect
          id={id}
          value={val}
          disabled={disabled}
          onChange={(v) => onChange(v)}
          options={f.options}
          placeholder="— Pilih —"
        />
      );
    }
    if (f.type === "textarea") {
      return <Textarea id={id} value={val} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    }
    if (f.type === "date") {
      return (
        <DatePicker
          id={id}
          value={val}
          disabled={disabled}
          onChange={(v) => onChange(v)}
          captionLayout="dropdown-buttons"
          fromYear={MIN_YEAR}
          toYear={MAX_YEAR}
        />
      );
    }
    const inputType = f.type === "number" ? "number" : "text";
    return <Input id={id} type={inputType} value={val} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
  };

  const finalLabel = submitLabel ?? (isEdit ? "Simpan Perubahan" : "Simpan");

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      {...(description ? { description } : {})}
      size="mega"
      tone="brand"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={pending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Menyimpan..." : finalLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errMsg ? (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
            {errMsg}
          </div>
        ) : null}
        {groupBySection(fields, "Data").map((group) => (
          <FormSection key={group.title} title={group.title}>
            {group.fields.map((f) => (
              <FormField
                key={f.name}
                label={f.label}
                htmlFor={`master-form-${f.name}`}
                {...(f.required ? { required: true } : {})}
                {...(f.hint ? { hint: f.hint } : {})}
              >
                {renderField(f)}
              </FormField>
            ))}
          </FormSection>
        ))}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

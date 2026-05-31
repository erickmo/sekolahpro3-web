import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

// Reusable create-form modal for guru sub-domain (P2).
// Each list route declares a schema; the modal renders fields and POSTs to the DocType.

// Rentang tahun DatePicker generik: satu dekade ke belakang s/d satu tahun ke depan.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

export type GuruFieldType = "text" | "number" | "date" | "select" | "textarea";

export interface GuruFieldDef {
  name: string;
  label: string;
  type: GuruFieldType;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
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

export interface GuruCreateModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  description?: string;
  fields: GuruFieldDef[];
  submitLabel?: string;
  onCreated?: (doc: Record<string, unknown>) => void;
}

function emptyValues(fields: GuruFieldDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.name] = f.defaultValue !== undefined ? String(f.defaultValue) : "";
  return out;
}

export function GuruCreateModal(props: GuruCreateModalProps) {
  const { open, onClose, doctype, title, description, fields, submitLabel = "Simpan", onCreated } = props;
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fields));
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const qc = useQueryClient();
  const mut = useResourceCreate(doctype);

  const reset = () => {
    setValues(emptyValues(fields));
    setErrMsg(null);
  };

  const handleClose = () => {
    if (mut.isPending) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);

    for (const f of fields) {
      if (f.required && !values[f.name]?.toString().trim()) {
        setErrMsg(`Field "${f.label}" wajib diisi.`);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
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
      const doc = await mut.mutateAsync(payload);
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      onCreated?.(doc as Record<string, unknown>);
      reset();
      onClose();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  };

  const renderField = (f: GuruFieldDef): ReactNode => {
    const id = `guru-create-${f.name}`;
    const val = values[f.name] ?? "";
    const onChange = (v: string) => setValues((prev) => ({ ...prev, [f.name]: v }));

    if (f.type === "select" && f.options) {
      return (
        <SearchableSelect
          id={id}
          value={val}
          onChange={(v) => onChange(v)}
          options={f.options}
          placeholder="— Pilih —"
        />
      );
    }
    if (f.type === "textarea") {
      return <Textarea id={id} value={val} onChange={(e) => onChange(e.target.value)} />;
    }
    if (f.type === "date") {
      return (
        <DatePicker
          id={id}
          value={val}
          onChange={(v) => onChange(v)}
          captionLayout="dropdown-buttons"
          fromYear={MIN_YEAR}
          toYear={MAX_YEAR}
        />
      );
    }
    const inputType = f.type === "number" ? "number" : "text";
    return <Input id={id} type={inputType} value={val} onChange={(e) => onChange(e.target.value)} />;
  };

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
          <Button variant="outline" onClick={handleClose} disabled={mut.isPending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>
            {mut.isPending ? "Menyimpan..." : submitLabel}
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
                htmlFor={`guru-create-${f.name}`}
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

export function formatGuruDate(s: string | undefined | null): string {
  if (!s) return "—";
  return s;
}

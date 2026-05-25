import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

export type FieldKind = "text" | "number" | "select" | "textarea";

export interface FieldSpec {
  name: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: Array<{ value: string; label: string }>;
  numeric?: boolean;
  colSpan?: 1 | 2;
}

interface CreateResourceModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  description?: string;
  submitLabel?: string;
  fields: FieldSpec[];
  /** Extra query keys to invalidate on success (besides ["resource:list", doctype]). */
  invalidateKeys?: Array<readonly unknown[]>;
  onSuccess?: (createdName: string) => void;
}

/**
 * Generic create-form modal — config-driven for simple akademik DocTypes.
 * Wraps useResourceCreate + invalidation. Numeric fields are coerced.
 */
export function CreateResourceModal(props: CreateResourceModalProps) {
  const {
    open, onClose, doctype, title, description,
    submitLabel = "Simpan", fields, invalidateKeys = [], onSuccess,
  } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(doctype);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const doc: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = fd.get(f.name);
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      if (f.numeric || f.kind === "number") {
        const n = Number(trimmed);
        if (!Number.isNaN(n)) doc[f.name] = n;
      } else {
        doc[f.name] = trimmed;
      }
    }
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      for (const k of invalidateKeys) {
        await qc.invalidateQueries({ queryKey: k as unknown as readonly unknown[] });
      }
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldsGrid fields={fields} />
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Memproses..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldsGrid({ fields }: { fields: FieldSpec[] }): ReactNode {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((f) => (
        <FieldControl key={f.name} field={f} />
      ))}
    </div>
  );
}

function FieldControl({ field }: { field: FieldSpec }): ReactNode {
  const span = field.colSpan === 2 ? "sm:col-span-2" : "";
  const kind = field.kind ?? "text";
  const baseInput =
    "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40";
  return (
    <div className={`flex flex-col gap-1.5 ${span}`}>
      <label className="text-xs font-medium text-fg" htmlFor={field.name}>
        {field.label}
        {field.required ? <span className="text-rose-600 ml-0.5">*</span> : null}
      </label>
      {kind === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          defaultValue={field.defaultValue !== undefined ? String(field.defaultValue) : ""}
          rows={3}
          className={baseInput}
        />
      ) : kind === "select" ? (
        <select
          id={field.name}
          name={field.name}
          required={!!field.required}
          defaultValue={field.defaultValue !== undefined ? String(field.defaultValue) : ""}
          className={baseInput}
        >
          <option value="">— pilih —</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={kind === "number" ? "number" : "text"}
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          defaultValue={field.defaultValue !== undefined ? String(field.defaultValue) : ""}
          className={baseInput}
        />
      )}
    </div>
  );
}

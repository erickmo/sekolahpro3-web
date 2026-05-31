import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  listResource,
  useResourceCreate,
  useResourceUpdate,
  useResourceDoc,
} from "@sekolahpro/api-client";

export type MasterFieldType =
  | "data"
  | "int"
  | "currency"
  | "date"
  | "select"
  | "link"
  | "check"
  | "text";

export interface MasterField {
  name: string;
  label: string;
  type: MasterFieldType;
  required?: boolean;
  /** Static enum values — used by `select`. */
  options?: string[];
  placeholder?: string;
  /** Span 1 (default) atau 2 kolom dalam grid. */
  colSpan?: 1 | 2;
  /** Target DocType — required when `type === "link"`. */
  linkDoctype?: string;
  /** Label field on the linked DocType. Defaults to `name`. */
  linkLabelField?: string;
  /** Optional logical group title. Fields sharing a section render together. */
  section?: string;
}

// Default year range for date pickers in master forms — narrow window around
// the present for fast year jumping. Override per field meaning if needed.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

const DEFAULT_SECTION = "Detail";

interface GenericFormModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  fields: MasterField[];
  /** Bila ada → edit mode; bila undefined → create mode. */
  editName?: string;
  onSuccess?: (name: string) => void;
}

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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

/** Coerce a raw form value into the typed value expected by the DocType. */
function coerce(field: MasterField, raw: string | boolean): unknown {
  if (field.type === "check") return raw ? 1 : 0;
  if (typeof raw !== "string") return raw;
  if (raw.trim() === "") return undefined;
  if (field.type === "int") {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  if (field.type === "currency") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return raw;
}

/** Group fields by their `section`, preserving declaration order. */
function groupSections(fields: MasterField[]): { title: string; fields: MasterField[] }[] {
  const order: string[] = [];
  const map = new Map<string, MasterField[]>();
  for (const f of fields) {
    const key = f.section ?? DEFAULT_SECTION;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(f);
  }
  return order.map((title) => ({ title, fields: map.get(title)! }));
}

export function GenericFormModal(props: GenericFormModalProps) {
  const { open, onClose, doctype, title, fields, editName, onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(doctype);
  const update = useResourceUpdate<{ name: string }>(doctype);
  const existing = useResourceDoc<Record<string, unknown>>(doctype, editName);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editName;

  useEffect(() => {
    if (!isEdit) {
      setValues({});
      return;
    }
    const doc = existing.data;
    if (!doc) return;
    const next: Record<string, string | boolean> = {};
    for (const f of fields) {
      const v = doc[f.name];
      if (v === null || v === undefined) continue;
      next[f.name] = f.type === "check" ? !!v : String(v);
    }
    setValues(next);
  }, [existing.data, isEdit, fields]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const doc: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name] ?? (f.type === "check" ? false : "");
      const coerced = coerce(f, v);
      if (coerced !== undefined) doc[f.name] = coerced;
      if (f.required && (coerced === undefined || coerced === "" || coerced === 0 && f.type !== "check")) {
        if (f.type === "check") continue;
        if (coerced === 0 && (f.type === "int" || f.type === "currency")) continue;
        setError(`${f.label} wajib diisi.`);
        return;
      }
    }
    try {
      const out = isEdit
        ? await update.mutateAsync({ name: editName!, patch: doc })
        : await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      onSuccess?.(out.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  };

  const renderField = (f: MasterField) => {
    const val = values[f.name];
    const setVal = (v: string | boolean) => setValues((s) => ({ ...s, [f.name]: v }));
    const span2 = f.colSpan === 2 || f.type === "text";
    const spanClass = span2 ? "col-span-2" : "";

    if (f.type === "check") {
      return (
        <FormField key={f.name} label={f.label} className={spanClass}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => setVal(e.target.checked)}
            />
            <span className="text-muted-fg">{f.placeholder ?? "Aktif"}</span>
          </label>
        </FormField>
      );
    }

    if (f.type === "link") {
      const ld = f.linkDoctype ?? "";
      const lf = f.linkLabelField ?? "name";
      return (
        <FormField key={f.name} label={f.label} required={f.required} className={spanClass}>
          <SearchableSelect
            value={typeof val === "string" ? val : ""}
            onChange={(v) => setVal(v)}
            placeholder={f.placeholder ?? "Cari…"}
            loadOptions={(q) => searchLink(ld, lf, q)}
          />
        </FormField>
      );
    }

    if (f.type === "select") {
      return (
        <FormField key={f.name} label={f.label} required={f.required} className={spanClass}>
          <SearchableSelect
            value={typeof val === "string" ? val : ""}
            onChange={(v) => setVal(v)}
            placeholder="— Pilih —"
            options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
          />
        </FormField>
      );
    }

    if (f.type === "text") {
      return (
        <FormField key={f.name} label={f.label} required={f.required} className="col-span-2">
          <Textarea
            value={typeof val === "string" ? val : ""}
            onChange={(e) => setVal(e.target.value)}
            placeholder={f.placeholder}
          />
        </FormField>
      );
    }

    if (f.type === "date") {
      return (
        <FormField key={f.name} label={f.label} required={f.required} className={spanClass}>
          <DatePicker
            value={typeof val === "string" ? val : ""}
            onChange={(v) => setVal(v)}
            captionLayout="dropdown-buttons"
            fromYear={MIN_YEAR}
            toYear={MAX_YEAR}
            {...(f.required ? { required: true } : {})}
            {...(f.placeholder ? { placeholder: f.placeholder } : {})}
          />
        </FormField>
      );
    }

    const inputType =
      f.type === "int" || f.type === "currency" ? "number" : "text";

    return (
      <FormField key={f.name} label={f.label} required={f.required} className={spanClass}>
        <Input
          type={inputType}
          value={typeof val === "string" ? val : ""}
          onChange={(e) => setVal(e.target.value)}
          required={f.required}
          placeholder={f.placeholder}
          {...(f.type === "currency" ? { step: 1, min: 0 } : {})}
          {...(f.type === "int" ? { step: 1 } : {})}
        />
      </FormField>
    );
  };

  if (!open) return null;
  const pending = create.isPending || update.isPending || (isEdit && existing.isLoading);
  const sections = groupSections(fields);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${title}` : `Tambah ${title}`}
      description="Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {sections.map((sec) => (
          <FormSection key={sec.title} title={sec.title}>
            {sec.fields.map(renderField)}
          </FormSection>
        ))}
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

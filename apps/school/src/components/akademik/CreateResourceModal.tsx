import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, FormGrid, Modal, SearchableSelect, type SearchableOption } from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

// Rentang tahun DatePicker akademik: satu dekade ke belakang s/d satu tahun ke depan.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

export type FieldKind =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "link"
  | "checkbox"
  | "date";

export interface ShowWhen {
  field: string;
  equals: string | number | boolean;
}

export interface FieldSpec {
  name: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string; hint?: string }>;
  numeric?: boolean;
  colSpan?: 1 | 2;
  /** For kind="link": Frappe doctype to query. */
  linkDoctype?: string;
  /** For kind="link": fields to fetch + use as label/hint. Defaults to ["name"]. */
  linkLabelField?: string;
  linkHintField?: string;
  linkFilters?: Array<[string, string, string | number]>;
  /** Show this field only when condition is met. */
  showWhen?: ShowWhen;
  /** Help text under field. */
  help?: ReactNode;
  /** Custom validator returning error string or null. */
  validate?: (val: unknown, all: Record<string, unknown>) => string | null;
  /** Monospace + uppercase coercion for codes. */
  uppercase?: boolean;
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
function groupBySection(
  fields: FieldSpec[],
  fallbackTitle: string,
): Array<{ title: string; fields: FieldSpec[] }> {
  const order: string[] = [];
  const map = new Map<string, FieldSpec[]>();
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

interface CreateResourceModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  description?: string;
  submitLabel?: string;
  fields: FieldSpec[];
  /** Initial values (e.g., context defaults like tahun_ajaran). */
  initialValues?: Record<string, unknown>;
  invalidateKeys?: Array<readonly unknown[]>;
  onSuccess?: (createdName: string) => void;
}

interface FrappeErrorPayload {
  message?: string;
  error_list?: Array<{ fieldname?: string; message?: string }>;
  exc_type?: string;
}

function parseFrappeError(err: unknown): { generic: string; perField: Record<string, string> } {
  const perField: Record<string, string> = {};
  let generic = "Gagal menyimpan";
  if (err instanceof Error) generic = err.message;
  const data = (err as { data?: FrappeErrorPayload } | null)?.data;
  if (data?.message) generic = data.message;
  for (const e of data?.error_list ?? []) {
    if (e.fieldname && e.message) perField[e.fieldname] = e.message;
  }
  return { generic, perField };
}

function fieldVisible(field: FieldSpec, values: Record<string, unknown>): boolean {
  if (!field.showWhen) return true;
  return values[field.showWhen.field] === field.showWhen.equals;
}

function defaultFor(field: FieldSpec): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.kind === "checkbox") return false;
  return "";
}

function buildInitial(
  fields: FieldSpec[],
  overrides: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.name] = defaultFor(f);
  if (overrides) Object.assign(out, overrides);
  return out;
}

export function CreateResourceModal(props: CreateResourceModalProps) {
  const {
    open,
    onClose,
    doctype,
    title,
    description,
    submitLabel = "Simpan",
    fields,
    initialValues,
    invalidateKeys = [],
    onSuccess,
  } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(doctype);
  const initial = useMemo(() => buildInitial(fields, initialValues), [fields, initialValues]);
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  // Reset state whenever modal opens.
  useEffect(() => {
    if (open) {
      setValues(initial);
      setErrors({});
      setGenericError(null);
    }
  }, [open, initial]);

  const setVal = useCallback((name: string, v: unknown) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => {
      if (!e[name]) return e;
      const { [name]: _drop, ...rest } = e;
      return rest;
    });
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGenericError(null);
    const visibleFields = fields.filter((f) => fieldVisible(f, values));
    const fieldErrs: Record<string, string> = {};
    const doc: Record<string, unknown> = {};

    for (const f of visibleFields) {
      const raw = values[f.name];
      const isEmpty =
        raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
      if (f.required && isEmpty) {
        fieldErrs[f.name] = "Wajib diisi";
        continue;
      }
      if (isEmpty) continue;

      let v: unknown = raw;
      if (typeof v === "string") v = v.trim();
      if (f.uppercase && typeof v === "string") v = v.toUpperCase();
      if (f.numeric || f.kind === "number") {
        const n = Number(v);
        if (Number.isNaN(n)) {
          fieldErrs[f.name] = "Harus angka";
          continue;
        }
        v = n;
      }
      if (f.kind === "checkbox") v = v ? 1 : 0;

      if (f.validate) {
        const errMsg = f.validate(v, values);
        if (errMsg) {
          fieldErrs[f.name] = errMsg;
          continue;
        }
      }
      doc[f.name] = v;
    }

    if (Object.keys(fieldErrs).length > 0) {
      setErrors(fieldErrs);
      return;
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
      const { generic, perField } = parseFrappeError(err);
      if (Object.keys(perField).length > 0) setErrors(perField);
      setGenericError(generic);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      size="mega"
      tone="brand"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {groupBySection(fields, "Data").map((group) => (
          <FormSection key={group.title} title={group.title}>
            {group.fields.map((f) =>
              fieldVisible(f, values) ? (
                <FieldControl
                  key={f.name}
                  field={f}
                  value={values[f.name]}
                  error={errors[f.name]}
                  setVal={setVal}
                />
              ) : null,
            )}
          </FormSection>
        ))}
        {genericError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {genericError}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Memproses..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface ControlProps {
  field: FieldSpec;
  value: unknown;
  error: string | undefined;
  setVal: (name: string, v: unknown) => void;
}

function FieldControl({ field, value, error, setVal }: ControlProps): ReactNode {
  const span = field.colSpan === 2 ? "sm:col-span-2" : "";
  const kind = field.kind ?? "text";
  const errCls = error ? "border-rose-500 ring-2 ring-rose-100" : "border-border";
  const baseInput = `w-full rounded-md border ${errCls} bg-bg px-3 py-2 text-sm text-fg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40`;

  const labelEl = (
    <label className="text-xs font-medium text-fg" htmlFor={field.name}>
      {field.label}
      {field.required ? <span className="text-rose-600 ml-0.5">*</span> : null}
    </label>
  );

  const errorEl = error ? <div className="text-xs text-rose-600">{error}</div> : null;
  const helpEl = !error && field.help ? <div className="text-xs text-muted-fg">{field.help}</div> : null;

  if (kind === "checkbox") {
    return (
      <div className={`flex flex-col gap-1 ${span}`}>
        <label className="flex items-center gap-2 text-sm text-fg" htmlFor={field.name}>
          <input
            id={field.name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setVal(field.name, e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          <span>
            {field.label}
            {field.required ? <span className="text-rose-600 ml-0.5">*</span> : null}
          </span>
        </label>
        {errorEl ?? helpEl}
      </div>
    );
  }

  if (kind === "link") {
    return (
      <div className={`flex flex-col gap-1.5 ${span}`}>
        {labelEl}
        <LinkField
          field={field}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => setVal(field.name, v)}
          errored={Boolean(error)}
        />
        {errorEl ?? helpEl}
      </div>
    );
  }

  if (kind === "textarea") {
    return (
      <div className={`flex flex-col gap-1.5 ${span}`}>
        {labelEl}
        <textarea
          id={field.name}
          name={field.name}
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setVal(field.name, e.target.value)}
          rows={3}
          className={baseInput}
        />
        {errorEl ?? helpEl}
      </div>
    );
  }

  if (kind === "date") {
    return (
      <div className={`flex flex-col gap-1.5 ${span}`}>
        {labelEl}
        <DatePicker
          id={field.name}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => setVal(field.name, v)}
          captionLayout="dropdown-buttons"
          fromYear={MIN_YEAR}
          toYear={MAX_YEAR}
        />
        {errorEl ?? helpEl}
      </div>
    );
  }

  if (kind === "select") {
    return (
      <div className={`flex flex-col gap-1.5 ${span}`}>
        {labelEl}
        <SearchableSelect
          id={field.name}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => setVal(field.name, v)}
          options={(field.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
          placeholder="— pilih —"
        />
        {errorEl ?? helpEl}
      </div>
    );
  }

  const monoCls = field.uppercase ? "font-mono uppercase tracking-wide" : "";
  return (
    <div className={`flex flex-col gap-1.5 ${span}`}>
      {labelEl}
      <input
        id={field.name}
        name={field.name}
        type={kind === "number" ? "number" : "text"}
        required={!!field.required}
        placeholder={field.placeholder ?? ""}
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => setVal(field.name, e.target.value)}
        className={`${baseInput} ${monoCls}`}
      />
      {errorEl ?? helpEl}
    </div>
  );
}

interface LinkFieldProps {
  field: FieldSpec;
  value: string;
  onChange: (v: string) => void;
  errored: boolean;
}

function LinkField({ field, value, onChange, errored }: LinkFieldProps): ReactNode {
  const doctype = field.linkDoctype ?? field.name;
  const labelField = field.linkLabelField ?? "name";
  const hintField = field.linkHintField;
  const fixedFilters = field.linkFilters;

  const loadOptions = useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const fields = ["name", labelField, ...(hintField ? [hintField] : [])];
      const filters: Array<[string, string, string | number]> = fixedFilters
        ? [...fixedFilters]
        : [];
      if (q) filters.push([labelField, "like", `%${q}%`]);
      const rows = await listResource<Record<string, unknown>>(doctype, {
        fields,
        filters,
        order_by: `\`${labelField}\` asc`,
        limit_page_length: 30,
      });
      return rows.map((r): SearchableOption => {
        const name = String(r.name ?? "");
        const label = String(r[labelField] ?? name);
        const opt: SearchableOption = { value: name, label };
        if (hintField) {
          const hint = r[hintField];
          if (hint != null && String(hint).trim() !== "") opt.hint = String(hint);
        }
        return opt;
      });
    },
    [doctype, labelField, hintField, fixedFilters],
  );

  return (
    <div className={errored ? "rounded-md ring-2 ring-rose-100" : ""}>
      <SearchableSelect
        id={field.name}
        value={value}
        onChange={onChange}
        loadOptions={loadOptions}
        placeholder={field.placeholder ?? `Cari ${doctype}…`}
      />
    </div>
  );
}

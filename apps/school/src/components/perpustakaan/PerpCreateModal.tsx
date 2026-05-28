import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  IconPlus,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

// Reusable create-form modal for perpustakaan sub-domain.
// Each list route declares a schema; the modal renders fields and POSTs to the DocType.
// Link fields render a SearchableSelect that queries the target DocType.

export type PerpFieldType = "text" | "number" | "date" | "select" | "textarea" | "link";

export interface PerpFieldDef {
  name: string;
  label: string;
  type: PerpFieldType;
  required?: boolean;
  hint?: string;
  /** Static options for `select`. */
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
  /** For `link`: target DocType to query. */
  linkDoctype?: string;
  /** For `link`: extra display field on the linked doc (e.g. "judul"). */
  linkLabelField?: string;
}

export interface PerpCreateModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  title: string;
  description?: string;
  fields: PerpFieldDef[];
  submitLabel?: string;
  onCreated?: (doc: Record<string, unknown>) => void;
}

function emptyValues(fields: PerpFieldDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.name] = f.defaultValue !== undefined ? String(f.defaultValue) : "";
  return out;
}

async function searchLink(
  doctype: string,
  labelField: string | undefined,
  q: string,
): Promise<SearchableOption[]> {
  const fields = labelField ? ["name", labelField] : ["name"];
  // OR-search by name + label field; Frappe like-operator uses %q%.
  const orFilters = q
    ? labelField
      ? ([
          ["name", "like", `%${q}%`],
          [labelField, "like", `%${q}%`],
        ] as [string, string, unknown][])
      : ([["name", "like", `%${q}%`]] as [string, string, unknown][])
    : undefined;
  const rows = await listResource<Record<string, unknown>>(doctype, {
    fields,
    ...(orFilters ? { or_filters: orFilters } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => {
    const name = String(r.name ?? "");
    const lbl = labelField ? String(r[labelField] ?? name) : name;
    const opt: SearchableOption = { value: name, label: lbl };
    if (labelField && lbl !== name) opt.hint = name;
    return opt;
  });
}

export function PerpCreateModal(props: PerpCreateModalProps) {
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

  const renderField = (f: PerpFieldDef): ReactNode => {
    const id = `perp-create-${f.name}`;
    const val = values[f.name] ?? "";
    const onChange = (v: string) => setValues((prev) => ({ ...prev, [f.name]: v }));

    if (f.type === "link" && f.linkDoctype) {
      const dt = f.linkDoctype;
      const lf = f.linkLabelField;
      return (
        <SearchableSelect
          id={id}
          value={val}
          onChange={(v) => onChange(v)}
          loadOptions={(q) => searchLink(dt, lf, q)}
          resolveLabel={async (v) => {
            if (!lf) return v;
            try {
              const rows = await listResource<Record<string, unknown>>(dt, {
                fields: ["name", lf],
                filters: { name: v },
                limit_page_length: 1,
              });
              const r = rows[0];
              return r ? String(r[lf] ?? r.name ?? v) : v;
            } catch {
              return v;
            }
          }}
          placeholder={`Cari ${f.label.toLowerCase()}…`}
        />
      );
    }
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
      return <DatePicker id={id} value={val} onChange={(v) => onChange(v)} />;
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
      icon={<IconPlus />}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={mut.isPending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>
            {mut.isPending ? "Menyimpan..." : submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errMsg ? (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
            {errMsg}
          </div>
        ) : null}
        <FormGrid cols={2}>
          {fields.map((f) => (
            <FormField
              key={f.name}
              label={f.label}
              htmlFor={`perp-create-${f.name}`}
              {...(f.required ? { required: true } : {})}
              {...(f.hint ? { hint: f.hint } : {})}
            >
              {renderField(f)}
            </FormField>
          ))}
        </FormGrid>
        {/* hidden submit so Enter works */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

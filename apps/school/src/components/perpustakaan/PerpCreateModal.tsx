import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

// Reusable create-form modal for perpustakaan sub-domain (P2).
// Each list route declares a schema; the modal renders fields and POSTs to the DocType.

export type PerpFieldType = "text" | "number" | "date" | "select" | "textarea";

export interface PerpFieldDef {
  name: string;
  label: string;
  type: PerpFieldType;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
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

    // Required field validation
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

    if (f.type === "select" && f.options) {
      return (
        <Select id={id} value={val} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Pilih —</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      );
    }
    if (f.type === "textarea") {
      return <Textarea id={id} value={val} onChange={(e) => onChange(e.target.value)} />;
    }
    const inputType = f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
    return <Input id={id} type={inputType} value={val} onChange={(e) => onChange(e.target.value)} />;
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      {...(description ? { description } : {})}
      size="lg"
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

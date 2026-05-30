import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceUpdate } from "@sekolahpro/api-client";

export interface ExtraField {
  name: string;
  label: string;
  type: "text" | "data";
  required?: boolean;
  placeholder?: string;
}

interface StatusActionModalProps {
  open: boolean;
  onClose: () => void;
  doctype: string;
  recordName: string;
  /** Status target setelah confirm. */
  targetStatus: string;
  title: string;
  description?: string;
  /** Field tambahan ditulis bersama status (mis. referensi_goaml). */
  extraFields?: ExtraField[];
  /** Field stempel waktu yang otomatis di-set ke `now()` (ISO datetime). */
  timestampField?: string;
  /** Field operator (User) — di-set ke user aktif bila supplied. */
  operatorField?: string;
  currentUser?: string | undefined;
  onSuccess?: () => void;
}

export function StatusActionModal(props: StatusActionModalProps) {
  const {
    open, onClose, doctype, recordName, targetStatus, title, description,
    extraFields = [], timestampField, operatorField, currentUser, onSuccess,
  } = props;
  const qc = useQueryClient();
  const update = useResourceUpdate<{ name: string }>(doctype);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const patch: Record<string, unknown> = { status: targetStatus };
    for (const f of extraFields) {
      const v = values[f.name];
      if (f.required && (!v || !v.trim())) {
        setError(`${f.label} wajib diisi.`);
        return;
      }
      if (v && v.trim()) patch[f.name] = v.trim();
    }
    if (timestampField) {
      patch[timestampField] = new Date().toISOString().slice(0, 19).replace("T", " ");
    }
    if (operatorField && currentUser) {
      patch[operatorField] = currentUser;
    }
    try {
      await update.mutateAsync({ name: recordName, patch });
      await qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        {description ? <p className="text-sm text-muted-fg">{description}</p> : null}
        {extraFields.length > 0 ? (
          <FormGrid cols={1}>
            {extraFields.map((f) => (
              <FormField key={f.name} label={f.label} required={f.required}>
                {f.type === "text" ? (
                  <Textarea
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                )}
              </FormField>
            ))}
          </FormGrid>
        ) : null}
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Memproses…" : `Set ${targetStatus}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

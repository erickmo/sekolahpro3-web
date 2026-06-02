import { useState } from "react";
import { Modal, FormField, Input, Select, Textarea, SearchableSelect, Button } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import type { CrudConfig, CrudField, CrudRow } from "./types";

function LinkInput({ field, value, onChange }: { field: CrudField; value: string; onChange: (v: string) => void }) {
  const q = useResourceList<{ name: string }>(field.linkDoctype!, { fields: ["name"], limit_page_length: 200 });
  const options = (q.data ?? []).map((r) => ({ label: r.name, value: r.name }));
  return <SearchableSelect value={value} options={options} onChange={onChange} placeholder={`Pilih ${field.label}`} />;
}

function FieldInput({ field, value, onChange }: { field: CrudField; value: string; onChange: (v: string) => void }) {
  if (field.type === "link") return <LinkInput field={field} value={value} onChange={onChange} />;
  if (field.type === "select")
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={field.readOnly}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  if (field.type === "textarea")
    return <Textarea value={value} onChange={(e) => onChange(e.target.value)} readOnly={field.readOnly} />;
  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={field.readOnly}
    />
  );
}

interface Props {
  config: CrudConfig;
  initial: CrudRow | null; // null = create
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  saving: boolean;
}

/** Create/edit modal driven by CrudConfig.fields. On create, nameField is required. */
export function CrudFormModal({ config, initial, onClose, onSubmit, saving }: Props) {
  const isEdit = initial !== null;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of config.fields) v[f.name] = initial?.[f.name] != null ? String(initial[f.name]) : "";
    if (!isEdit) v[config.nameField] = "";
    return v;
  });
  const set = (k: string) => (val: string) => setValues((p) => ({ ...p, [k]: val }));

  return (
    <Modal open onClose={onClose} title={`${isEdit ? "Edit" : "Tambah"} ${config.title}`}>
      <div className="space-y-3">
        {config.fields.map((f) => (
          <FormField key={f.name} label={f.label}>
            <FieldInput field={{ ...f, readOnly: f.readOnly || (isEdit && f.name === config.nameField) }} value={values[f.name] ?? ""} onChange={set(f.name)} />
          </FormField>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button onClick={() => onSubmit(values)} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </Modal>
  );
}

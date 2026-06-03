import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  FormField,
  Input,
  Modal,
  PageHeader,
  Select,
  SkeletonText,
  Textarea,
  type Column,
} from "@sekolahpro/ui";
import {
  useDeleteKonten,
  useKontenList,
  useSaveKonten,
  type KontenRow,
} from "../../data/situs";
import type { KontenField, KontenSchema } from "./schemas";
import { ImageInput } from "./ImageInput";

type FormState = Record<string, unknown>;

function emptyForm(schema: KontenSchema): FormState {
  const f: FormState = { status: "Draft" };
  for (const field of schema.fields) if (field.type === "check") f[field.name] = 0;
  return f;
}

function FieldInput({ field, id, value, onChange }: { field: KontenField; id: string; value: unknown; onChange: (v: unknown) => void }) {
  const str = value == null ? "" : String(value);
  if (field.type === "select") {
    return (
      <Select id={id} value={str} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  }
  if (field.type === "textarea" || field.type === "richtext") {
    return <Textarea id={id} rows={field.type === "richtext" ? 6 : 3} value={str} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "check") {
    return (
      <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="h-5 w-5" />
    );
  }
  if (field.type === "image") {
    return <ImageInput id={id} value={str} onChange={onChange} alt={field.label} />;
  }
  const inputType = field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text";
  return <Input id={id} type={inputType} value={str} onChange={(e) => onChange(e.target.value)} />;
}

/** Names of required fields whose current value is blank (null/empty/whitespace). */
function missingRequired(schema: KontenSchema, form: FormState): string[] {
  return schema.fields
    .filter((f) => f.required)
    .filter((f) => String(form[f.name] ?? "").trim() === "")
    .map((f) => f.name);
}

/** Generic list + create/edit/delete for one situs content doctype. */
export function KontenManager({ sekolah, schema }: { sekolah: string; schema: KontenSchema }) {
  const list = useKontenList(sekolah, schema.doctype);
  const save = useSaveKonten(sekolah, schema.doctype);
  const remove = useDeleteKonten(sekolah, schema.doctype);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const open = (row?: KontenRow) => { setErrors({}); setForm(row ? { ...row } : emptyForm(schema)); };
  const close = () => { setErrors({}); setForm(null); };

  // Clear one field's error as the user types so the inline message disappears immediately.
  const setField = (name: string, v: unknown) => {
    setForm((f) => (f ? { ...f, [name]: v } : f));
    setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
  };

  const submit = () => {
    if (!form) return;
    // Client-side required check so the user sees which fields are missing before a
    // round-trip; the server still validates as the source of truth.
    const missing = missingRequired(schema, form);
    if (missing.length > 0) {
      setErrors(Object.fromEntries(missing.map((n) => [n, "Wajib diisi"])));
      return;
    }
    save.mutate(form, { onSuccess: close });
  };

  const listFields = schema.fields.filter((f) => f.listColumn);
  const columns: Column<KontenRow>[] = [
    ...listFields.map((f) => ({
      key: f.name,
      header: f.label,
      cell: (row: KontenRow) =>
        f.name === "status" ? (
          <Badge tone={row.status === "Terbit" ? "success" : "neutral"}>{String(row.status ?? "")}</Badge>
        ) : f.type === "check" ? (
          row[f.name] ? "Ya" : "—"
        ) : (
          String(row[f.name] ?? "—")
        ),
    })),
    {
      key: "_aksi",
      header: "Aksi",
      align: "right" as const,
      cell: (row: KontenRow) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => open(row)}>Ubah</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Hapus "${String(row[schema.titleField] ?? "")}"?`)) remove.mutate({ name: row.name });
            }}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const isNew = form != null && !form.name;

  return (
    <div className="space-y-4">
      <PageHeader
        title={schema.singular}
        description={`Kelola ${schema.singular.toLowerCase()} yang tampil di situs sekolah.`}
        actions={<Button onClick={() => open()}>+ Tambah {schema.singular}</Button>}
      />

      {list.isLoading ? (
        <Card className="p-5"><SkeletonText lines={5} /></Card>
      ) : list.isError ? (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-rose-600">Gagal memuat data. Coba muat ulang.</p>
          <Button variant="ghost" onClick={() => list.refetch()}>Muat ulang</Button>
        </Card>
      ) : (
        <DataTable
          data={list.data ?? []}
          columns={columns}
          rowKey={(r) => r.name}
          empty={<EmptyState title={`Belum ada ${schema.singular.toLowerCase()}`} description="Klik tombol Tambah untuk membuat yang pertama." />}
        />
      )}

      <Modal
        open={form != null}
        onClose={close}
        title={isNew ? `Tambah ${schema.singular}` : `Ubah ${schema.singular}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Batal</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button>
          </div>
        }
      >
        {form ? (
          <div className="grid gap-4">
            {schema.fields.map((field) => {
              const fieldId = `kf-${field.name}`;
              return (
                <FormField key={field.name} label={field.label} htmlFor={fieldId} required={field.required} error={errors[field.name] || undefined}>
                  <FieldInput field={field} id={fieldId} value={form[field.name]} onChange={(v) => setField(field.name, v)} />
                </FormField>
              );
            })}
            {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan. Periksa isian wajib.</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import { useSaveSitus } from "../../data/situs";
import type { ChildSchema, KontenField } from "./schemas";

type Row = Record<string, unknown>;

/** A blank row seeded from the schema (checkboxes default to 0, text to ""). */
function emptyRow(schema: ChildSchema): Row {
  const r: Row = {};
  for (const f of schema.fields) r[f.name] = f.type === "check" ? 0 : "";
  return r;
}

/** Pure array move helper — out-of-range targets are no-ops. */
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

/** Render one schema field as the matching control; `id` wires the FormField label. */
function RowFieldInput({ field, id, value, onChange }: { field: KontenField; id: string; value: unknown; onChange: (v: unknown) => void }) {
  const s = value == null ? "" : String(value);
  if (field.type === "select") {
    return (
      <Select id={id} value={s} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  }
  if (field.type === "textarea" || field.type === "richtext") {
    return <Textarea id={id} rows={field.type === "richtext" ? 6 : 3} value={s} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "check") {
    return <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="h-5 w-5" />;
  }
  const t = field.type === "number" ? "number" : "text";
  return <Input id={id} type={t} value={s} onChange={(e) => onChange(e.target.value)} />;
}

/** Generic add/edit/delete/reorder for one Situs Sekolah child table; saves the whole array. */
export function ChildArrayManager({ sekolah, schema, rows }: { sekolah: string; schema: ChildSchema; rows: Row[] }) {
  const save = useSaveSitus(sekolah);
  const [items, setItems] = useState<Row[]>(rows);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);

  // Re-sync local edits when the parent supplies a fresh server array.
  useEffect(() => setItems(rows), [rows]);

  const openNew = () => { setEditIdx(items.length); setDraft(emptyRow(schema)); };
  const openEdit = (i: number) => { setEditIdx(i); setDraft({ ...items[i] }); };
  const closeDraft = () => { setEditIdx(null); setDraft(null); };

  // Commit the modal draft into the in-memory array (new row appends, existing replaces).
  const commitDraft = () => {
    if (draft == null || editIdx == null) return;
    const next = items.slice();
    next[editIdx] = draft;
    setItems(next);
    closeDraft();
  };

  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const reorder = (i: number, dir: -1 | 1) => setItems(move(items, i, i + dir));

  return (
    <div className="space-y-4">
      <PageHeader
        title={schema.singular}
        description={`Kelola daftar ${schema.singular.toLowerCase()} pada situs sekolah.`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={openNew}>+ Tambah {schema.singular}</Button>
            <Button onClick={() => save.mutate({ [schema.field]: items })} disabled={save.isPending}>
              {save.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState title={`Belum ada ${schema.singular.toLowerCase()}`} description="Klik Tambah untuk membuat yang pertama." />
      ) : (
        <div className="space-y-2">
          {items.map((row, i) => (
            <Card key={i} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{String(row[schema.titleField] ?? "—")}</p>
                <Badge tone="neutral">{`#${i + 1}`}</Badge>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" aria-label="Naikkan" disabled={i === 0} onClick={() => reorder(i, -1)}>↑</Button>
                <Button variant="ghost" size="sm" aria-label="Turunkan" disabled={i === items.length - 1} onClick={() => reorder(i, 1)}>↓</Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>Ubah</Button>
                <Button variant="ghost" size="sm" aria-label="Hapus" onClick={() => remove(i)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={draft != null}
        onClose={closeDraft}
        title={editIdx != null && editIdx < items.length ? `Ubah ${schema.singular}` : `Tambah ${schema.singular}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDraft}>Batal</Button>
            <Button onClick={commitDraft}>Simpan baris</Button>
          </div>
        }
      >
        {draft ? (
          <div className="grid gap-4">
            {schema.fields.map((field) => {
              const fieldId = `${schema.field}-${field.name}`;
              return (
                <FormField key={field.name} label={field.label} htmlFor={fieldId} required={field.required}>
                  <RowFieldInput field={field} id={fieldId} value={draft[field.name]} onChange={(v) => setDraft({ ...draft, [field.name]: v })} />
                </FormField>
              );
            })}
          </div>
        ) : null}
      </Modal>

      {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan. Coba lagi.</p> : null}
    </div>
  );
}

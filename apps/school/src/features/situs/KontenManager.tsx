import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  FormField,
  Input,
  Modal,
  PageHeader,
  Select,
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
import { PageGuide } from "../../components/guide";
import { SITUS_PAGE_GUIDES, type SitusGuideId } from "../../components/situs/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../lib/schoolGuideRole";

type FormState = Record<string, unknown>;

function emptyForm(schema: KontenSchema): FormState {
  const f: FormState = { status: "Draft" };
  for (const field of schema.fields) if (field.type === "check") f[field.name] = 0;
  return f;
}

function FieldInput({ field, value, onChange }: { field: KontenField; value: unknown; onChange: (v: unknown) => void }) {
  const str = value == null ? "" : String(value);
  if (field.type === "select") {
    return (
      <Select value={str} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  }
  if (field.type === "textarea" || field.type === "richtext") {
    return <Textarea rows={field.type === "richtext" ? 6 : 3} value={str} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "check") {
    return (
      <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="h-5 w-5" />
    );
  }
  const inputType = field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text";
  return <Input type={inputType} value={str} onChange={(e) => onChange(e.target.value)} />;
}

/** Generic list + create/edit/delete for one situs content doctype. */
export function KontenManager({
  sekolah,
  schema,
  guideId,
}: {
  sekolah: string;
  schema: KontenSchema;
  /** Optional page-guide id; renders the "Cara pakai" panel under the header. */
  guideId?: SitusGuideId;
}) {
  const list = useKontenList(sekolah, schema.doctype);
  const save = useSaveKonten(sekolah, schema.doctype);
  const remove = useDeleteKonten(sekolah, schema.doctype);
  const [form, setForm] = useState<FormState | null>(null);

  const open = (row?: KontenRow) => setForm(row ? { ...row } : emptyForm(schema));
  const close = () => setForm(null);

  const submit = () => {
    if (!form) return;
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
  const guide = guideId ? SITUS_PAGE_GUIDES[guideId] : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={schema.singular}
        description={`Kelola ${schema.singular.toLowerCase()} yang tampil di situs sekolah.`}
        actions={<Button onClick={() => open()}>+ Tambah {schema.singular}</Button>}
      />

      {guide && guideId ? (
        <PageGuide
          storageNamespace="situs-guide:"
          storageId={guideId}
          title={guide.title}
          intro={guide.intro}
          steps={guide.steps}
          tips={guide.tips}
          roleLabels={SCHOOL_ROLE_LABEL}
        />
      ) : null}

      <DataTable
        data={list.data ?? []}
        columns={columns}
        rowKey={(r) => r.name}
        empty={<EmptyState title={`Belum ada ${schema.singular.toLowerCase()}`} description="Klik tombol Tambah untuk membuat yang pertama." />}
      />

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
            {schema.fields.map((field) => (
              <FormField key={field.name} label={field.label} required={field.required}>
                <FieldInput field={field} value={form[field.name]} onChange={(v) => setForm({ ...form, [field.name]: v })} />
              </FormField>
            ))}
            {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan. Periksa isian wajib.</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { PageHeader, Card, DataTable, Button, IconPlus, type Column } from "@sekolahpro/ui";
import {
  useResourceList, useResourceCreate, useResourceUpdate, useResourceDelete,
} from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { CrudConfig, CrudRow } from "./types";
import { CrudFormModal } from "./CrudFormModal";

/** Strip empty strings so we don't overwrite Frappe fields with "". */
function clean(values: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) if (v !== "") out[k] = v;
  return out;
}

export function ResourceCrudPage({ config }: { config: CrudConfig }) {
  const qc = useQueryClient();
  const listQ = useResourceList<CrudRow>(config.doctype, {
    fields: config.listFields, limit_page_length: 200, order_by: "modified desc",
  });
  const createM = useResourceCreate(config.doctype);
  const updateM = useResourceUpdate(config.doctype);
  const deleteM = useResourceDelete(config.doctype);
  const [editing, setEditing] = useState<CrudRow | null | undefined>(undefined); // undefined=closed, null=create

  const invalidate = () => qc.invalidateQueries({ queryKey: ["resource:list", config.doctype] });

  function submit(values: Record<string, string>) {
    const body = clean(values);
    const done = { onSuccess: () => { invalidate(); setEditing(undefined); } };
    if (editing) updateM.mutate({ name: editing.name, patch: body }, done);
    else createM.mutate(body, done);
  }

  function remove(row: CrudRow) {
    if (!window.confirm(`Hapus ${row.name}?`)) return;
    deleteM.mutate(row.name, { onSuccess: invalidate });
  }

  const columns: Column<CrudRow>[] = [
    ...config.fields.filter((f) => !f.hideInTable).map((f) => ({
      key: f.name,
      header: f.label,
      cell: (r: CrudRow) => (f.render ? f.render(r[f.name]) : (r[f.name] != null ? String(r[f.name]) : "—")),
    })),
    {
      key: "_actions", header: "", align: "right" as const,
      cell: (r: CrudRow) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(r)}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button className="gap-2" onClick={() => setEditing(null)}>
            <span className="h-4 w-4"><IconPlus /></span> Tambah
          </Button>
        }
      />
      <Card className="p-0 overflow-hidden mt-6">
        <DataTable<CrudRow>
          data={listQ.data ?? []}
          columns={columns}
          rowKey={(r) => r.name}
          empty={
            <div className="p-8 text-center text-sm text-muted-fg">
              {listQ.isLoading ? "Memuat…" : listQ.error ? "Gagal memuat." : "Belum ada data."}
            </div>
          }
        />
      </Card>
      {editing !== undefined && (
        <CrudFormModal
          config={config}
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSubmit={submit}
          saving={createM.isPending || updateM.isPending}
        />
      )}
    </>
  );
}

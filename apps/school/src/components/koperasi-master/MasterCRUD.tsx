import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../ResourceListPage";
import { GenericFormModal } from "./GenericFormModal";
import type { MasterConfig, MasterColumn } from "../../lib/koperasi/masterConfigs";

type Row = Record<string, unknown> & { name: string };

function formatCell(value: unknown, format: MasterColumn["format"]): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-muted-fg">—</span>;
  if (format === "currency") {
    const n = typeof value === "number" ? value : Number(value);
    return <span className="tabular-nums">Rp {n.toLocaleString("id-ID")}</span>;
  }
  if (format === "date") {
    const s = String(value);
    return s.length > 10 ? s.slice(0, 10) : s;
  }
  if (format === "check") {
    return value ? <Badge tone="success" dot>Ya</Badge> : <Badge tone="neutral">—</Badge>;
  }
  return String(value);
}

export function MasterCRUD({ config }: { config: MasterConfig }) {
  const [editName, setEditName] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const columns: Column<Row>[] = config.columns.map((c) => ({
    key: c.key,
    header: c.header,
    align: c.align,
    sortable: true,
    cell: (r) => formatCell(r[c.key], c.format),
  }));

  const onAdd = () => {
    setEditName(undefined);
    setOpen(true);
  };

  const onRowClick = (r: Row) => {
    setEditName(r.name);
    setOpen(true);
  };

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Pengaturan"
        title={config.label}
        doctype={config.doctype}
        fields={config.listFields}
        rowKey={(r) => r.name}
        columns={columns}
        {...(config.defaultSort
          ? { defaultSort: { key: config.defaultSort.key, dir: config.defaultSort.dir } }
          : {})}
        {...(config.searchFields ? { searchFields: config.searchFields } : {})}
        addLabel={`Tambah ${config.singular}`}
        onAdd={onAdd}
        onRowClick={onRowClick}
      />
      <GenericFormModal
        open={open}
        onClose={() => setOpen(false)}
        doctype={config.doctype}
        title={config.singular}
        fields={config.fields}
        {...(editName ? { editName } : {})}
      />
    </>
  );
}

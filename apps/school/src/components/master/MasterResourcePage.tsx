import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Column, SortState } from "@sekolahpro/ui";
import { ResourceListPage } from "../ResourceListPage";
import { MasterCreateModal, type MasterFieldDef } from "./MasterCreateModal";

// Shared list page for master.* domain. Wires ResourceListPage + MasterCreateModal +
// row click navigation to the detail route. Each master.<X> list reduces to a config object.

export interface MasterResourcePageProps<T extends Record<string, unknown>> {
  eyebrow?: string;
  title: string;
  description?: string;
  doctype: string;
  fields: string[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  defaultSort?: SortState;
  searchFields?: string[];
  detailRoute: string;
  detailParams: (row: T) => Record<string, string>;
  formTitle: string;
  formFields: MasterFieldDef[];
  addLabel?: string;
}

export function MasterResourcePage<T extends Record<string, unknown>>(props: MasterResourcePageProps<T>) {
  const {
    eyebrow,
    title,
    description,
    doctype,
    fields,
    rowKey,
    columns,
    defaultSort,
    searchFields,
    detailRoute,
    detailParams,
    formTitle,
    formFields,
    addLabel,
  } = props;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<T>
        {...(eyebrow ? { eyebrow } : {})}
        title={title}
        {...(description ? { description } : {})}
        doctype={doctype}
        fields={fields}
        rowKey={rowKey}
        columns={columns}
        {...(defaultSort ? { defaultSort } : {})}
        {...(searchFields ? { searchFields } : {})}
        {...(addLabel ? { addLabel } : {})}
        onAdd={() => setOpen(true)}
        onRowClick={(row) =>
          // TanStack Router types: cast to any for dynamic $name route templates.
          navigate({ to: detailRoute as never, params: detailParams(row) as never })
        }
      />
      <MasterCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype={doctype}
        title={formTitle}
        fields={formFields}
      />
    </>
  );
}

import type { ReactNode } from "react";
import { Button, DataTable, SectionCard, type Column } from "@sekolahpro/ui";

/**
 * Generic koperasi report section: a SectionCard wrapping a DataTable plus an
 * optional "Unduh CSV" action. Pure pass-through — it owns no data fetching and
 * accepts the ui `Column<T>[]` contract directly so each report stays identical-
 * shaped (mirrors NasabahRelatedLists' SectionCard + DataTable precedent).
 */
interface Props<T> {
  title: string;
  description?: string | undefined;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  footer?: ReactNode | undefined;
  empty?: ReactNode | undefined;
  onUnduh?: (() => void) | undefined;
}

export function RekapSection<T>({
  title,
  description,
  columns,
  rows,
  rowKey,
  footer,
  empty,
  onUnduh,
}: Props<T>) {
  return (
    <SectionCard
      title={title}
      description={description}
      padded={false}
      action={
        onUnduh ? (
          <Button size="sm" variant="outline" onClick={onUnduh} disabled={rows.length === 0}>
            Unduh CSV
          </Button>
        ) : undefined
      }
    >
      <DataTable<T> data={rows} columns={columns} rowKey={rowKey} footer={footer} empty={empty} />
    </SectionCard>
  );
}

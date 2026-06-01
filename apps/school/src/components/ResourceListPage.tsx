import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
  IconDownload,
  type SelectFilter,
  type SortState,
} from "@sekolahpro/ui";
import { downloadCsv } from "../lib/stub";
import { ListSummary } from "./ListSummary";
import { ListTableEmpty } from "./ListTableEmpty";
import { SkeletonRows } from "./SkeletonRows";
import { isFirstRunEmpty } from "../lib/orang/listSummary";
import { useResourceList, listResource, type ListParams } from "@sekolahpro/api-client";
import type { ResourceListPageProps } from "./ResourceListPage.types";

export type { ResourceListPageProps } from "./ResourceListPage.types";

export function ResourceListPage<T extends Record<string, unknown>>(props: ResourceListPageProps<T>) {
  const {
    eyebrow,
    title,
    description,
    doctype,
    fields,
    rowKey,
    columns,
    defaultSort,
    searchFields = ["name"],
    selectFilters = [],
    baseFilters,
    decorateRows,
    extraActions,
    onAdd,
    addLabel = "Tambah",
    pageSize: defaultPageSize = 25,
    onRowClick,
    exportConfig,
    summarize,
    summaryFields,
    gettingStarted,
  } = props;

  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterVals, setFilterVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectFilters.map((f) => [f.key, "Semua"])),
  );
  const [sort, setSort] = useState<SortState>(defaultSort ?? { key: "modified", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filters: ListParams["filters"] = useMemo(() => {
    const out: Array<[string, string, unknown]> = [];
    if (baseFilters && baseFilters.length) {
      out.push(...(baseFilters as Array<[string, string, unknown]>));
    }
    for (const f of selectFilters) {
      // Controlled mode wins over internal mirror.
      const v = f.value ?? filterVals[f.key];
      if (v && v !== "Semua") out.push([f.field, "=", v]);
    }
    if (search.trim()) {
      // basic OR-search via name; richer search later
      out.push(["name", "like", `%${search.trim()}%`]);
    }
    return out;
  }, [filterVals, search, selectFilters, baseFilters]);

  const orFilters: ListParams["or_filters"] = useMemo(() => {
    if (!search.trim() || searchFields.length <= 1) return undefined;
    return searchFields.map((f) => [f, "like", `%${search.trim()}%`] as [string, string, unknown]);
  }, [search, searchFields]);

  const params: ListParams = useMemo(() => {
    const p: ListParams = {
      fields,
      order_by: `\`${sort.key}\` ${sort.dir}`,
      limit_start: (page - 1) * pageSize,
      limit_page_length: pageSize + 1,
    };
    if (orFilters) {
      p.or_filters = orFilters;
      // strip the name-like from filters when using or_filters
      const stripped = (filters as Array<[string, string, unknown]>).filter(
        ([f, op]) => !(f === "name" && op === "like"),
      );
      if (stripped.length) p.filters = stripped;
    } else if (filters && (filters as unknown[]).length) {
      p.filters = filters;
    }
    return p;
  }, [fields, sort, page, pageSize, filters, orFilters]);

  const q = useResourceList<T>(doctype, params);

  const fetched = q.data ?? [];
  const hasNext = fetched.length > pageSize;
  const baseRows = hasNext ? fetched.slice(0, pageSize) : fetched;

  // Run optional async decorator on the page slice. Falls back to raw rows on error
  // or while pending. See PERP-ADR-0001 for the use case (denda summary enrichment).
  const [decorated, setDecorated] = useState<T[] | null>(null);
  useEffect(() => {
    if (!decorateRows) {
      setDecorated(null);
      return;
    }
    let cancelled = false;
    decorateRows(baseRows)
      .then((next) => {
        if (!cancelled) setDecorated(next);
      })
      .catch(() => {
        if (!cancelled) setDecorated(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, decorateRows]);
  const rows = decorateRows ? (decorated ?? baseRows) : baseRows;

  async function handleExport() {
    if (!exportConfig || exporting) return;
    setExporting(true);
    try {
      // Re-run the current query with pagination disabled (limit_page_length: 0
      // = all rows in Frappe) so the export covers every matching row, not just
      // the visible page.
      const exportParams: ListParams = {
        ...params,
        fields: exportConfig.fields,
        limit_start: 0,
        limit_page_length: 0,
      };
      const all = await listResource<T>(doctype, exportParams);
      // downloadCsv shows its own alert when the result set is empty.
      downloadCsv(exportConfig.fileName, all.map(exportConfig.mapRow));
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  // True only when a select filter is narrowed away from the "Semua" sentinel.
  const hasActiveFilter = selectFilters.some(
    (f) => (f.value ?? filterVals[f.key] ?? "Semua") !== "Semua",
  );
  // Greet first-time users (genuinely empty, unfiltered list) with onboarding
  // guidance instead of a bare table. Filtered/searched empties stay normal.
  const showGettingStarted =
    !!gettingStarted &&
    isFirstRunEmpty({
      isLoading: q.isLoading,
      isError: q.isError,
      rowCount: rows.length,
      hasSearch: !!search.trim(),
      hasActiveFilter,
    });

  const filterUI: SelectFilter[] = selectFilters.map((f) => ({
    key: f.key,
    label: f.label,
    value: f.value ?? filterVals[f.key] ?? "Semua",
    options: f.options,
    onChange: (v) => {
      if (f.onChange) {
        // Controlled mode — parent owns state; don't mirror locally.
        f.onChange(v);
      } else {
        setFilterVals((prev) => ({ ...prev, [f.key]: v }));
      }
      setPage(1);
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        {...(eyebrow ? { eyebrow } : {})}
        title={title}
        {...(description ? { description } : {})}
        actions={
          <>
            {extraActions}
            {exportConfig ? (
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                <span className="h-4 w-4 mr-1.5">
                  <IconDownload />
                </span>
                {exporting ? "Mengekspor..." : "Export"}
              </Button>
            ) : null}
            {onAdd ? (
              <Button onClick={onAdd}>
                <span className="h-4 w-4 mr-1.5">
                  <IconPlus />
                </span>
                {addLabel}
              </Button>
            ) : null}
          </>
        }
      />

      {summarize ? (
        <ListSummary
          doctype={doctype}
          summaryFields={summaryFields ?? fields}
          {...(baseFilters ? { baseFilters } : {})}
          summarize={summarize}
        />
      ) : null}

      {showGettingStarted ? (
        gettingStarted
      ) : (
        <>
          <FilterBar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: "Cari...",
            }}
            filters={filterUI}
          />

          <SectionCard
        title={`${rows.length} baris${q.isFetching && rows.length > 0 ? " · memuat..." : ""}`}
        action={
          q.isError ? (
            <div className="flex items-center gap-2">
              <Badge tone="danger">Gagal memuat</Badge>
              <Button variant="outline" onClick={() => q.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : null
        }
        padded={false}
      >
        {q.isLoading && rows.length === 0 ? (
          <SkeletonRows count={pageSize > 8 ? 8 : pageSize} cols={Math.min(columns.length, 5)} />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            rowKey={rowKey}
            sort={sort}
            onSortChange={setSort}
            {...(onRowClick ? { onRowClick } : {})}
            empty={
              <ListTableEmpty
                isError={q.isError}
                {...(q.isError ? { errorMessage: (q.error as Error).message } : {})}
                onRetry={() => q.refetch()}
              />
            }
            footer={
              <Pagination
                page={page}
                pageSize={pageSize}
                total={(page - 1) * pageSize + rows.length + (hasNext ? 1 : 0)}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            }
          />
        )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

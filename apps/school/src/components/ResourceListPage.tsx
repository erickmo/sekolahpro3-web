import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
  type Column,
  type SelectFilter,
  type SortState,
} from "@sekolahpro/ui";
import { useResourceList, type ListParams, type FilterTuple } from "@sekolahpro/api-client";

export interface ResourceListPageProps<T extends Record<string, unknown>> {
  eyebrow?: string;
  title: string;
  description?: string;
  doctype: string;
  fields: string[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  defaultSort?: SortState;
  searchFields?: string[];
  selectFilters?: Array<{
    key: string;
    label: string;
    field: string;
    options: Array<{ value: string; label: string }>;
    /**
     * Controlled value. When provided, the filter operates in controlled mode and
     * `onChange` becomes the sole source of state updates (no internal mirror).
     * See PERP-ADR-0001 — required for URL-synced filters in /perpustakaan/peminjaman.
     */
    value?: string;
    /**
     * Controlled change handler. Required when `value` is set. Fires with the new
     * selected value (e.g. "Semua" sentinel) so the parent can sync URL/search state.
     * See PERP-ADR-0001.
     */
    onChange?: (value: string) => void;
  }>;
  /**
   * Extra filter clauses appended unconditionally to the list query (in addition to
   * `selectFilters` + search). Use for server-side scoping that the user cannot toggle
   * (e.g. `status in ["Aktif","Terlambat"]` for the default circulation view).
   * See PERP-ADR-0001.
   */
  baseFilters?: FilterTuple[];
  /**
   * Async post-processor invoked on each loaded page. Receives the visible rows and
   * returns a (possibly enriched / filtered) array used for render. Use to fetch
   * derived data per page (e.g. denda summary) without coupling to the list endpoint.
   * See PERP-ADR-0001.
   */
  decorateRows?: (rows: T[]) => Promise<T[]>;
  extraActions?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

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
  } = props;

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
        title={`${rows.length} baris${q.isFetching ? " · memuat..." : ""}`}
        action={
          q.isError ? <Badge tone="danger">Gagal memuat</Badge> : null
        }
        padded={false}
      >
        <DataTable
          data={rows}
          columns={columns}
          rowKey={rowKey}
          sort={sort}
          onSortChange={setSort}
          {...(onRowClick ? { onRowClick } : {})}
          empty={
            <div>
              <div className="font-medium text-fg">
                {q.isLoading ? "Memuat data..." : "Belum ada data"}
              </div>
              <div className="text-xs mt-1">
                {q.isError
                  ? (q.error as Error).message
                  : "Coba ubah filter atau buat data baru."}
              </div>
            </div>
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
      </SectionCard>
    </div>
  );
}

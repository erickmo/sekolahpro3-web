/**
 * InboxList — the left pane of the "Masuk" lane: search box, status filter pills, and
 * the scrollable message list. Extracted verbatim from the original route (behavior
 * unchanged); selection state is owned by the parent MasukDesk.
 */
import { Avatar, Badge, IconSearch } from "@sekolahpro/ui";
import { FILTERS, STATUS_TONE, formatWaktu, stripHtml, type FilterKey, type InboxRow } from "../../lib/pesan/inbox";

interface InboxListProps {
  rows: InboxRow[];
  selectedName: string | null;
  search: string;
  filter: FilterKey;
  loading: boolean;
  error: boolean;
  onSearch: (v: string) => void;
  onFilter: (f: FilterKey) => void;
  onSelect: (name: string) => void;
}

export function InboxList({
  rows,
  selectedName,
  search,
  filter,
  loading,
  error,
  onSearch,
  onFilter,
  onSelect,
}: InboxListProps) {
  return (
    <div className="border-r border-border flex flex-col">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari pesan..."
            className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-bg text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={
                filter === f
                  ? "px-2.5 py-1 rounded-full text-xs font-medium bg-brand text-white"
                  : "px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-fg/70 hover:bg-muted/80"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto flex-1 max-h-[640px]">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-fg">Memuat...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-fg">
            {error ? "Gagal memuat." : "Tidak ada pesan."}
          </div>
        ) : (
          rows.map((p) => {
            const active = p.name === selectedName;
            return (
              <button
                key={p.name}
                onClick={() => onSelect(p.name)}
                className={
                  (active
                    ? "bg-brand/5 border-l-2 border-l-brand "
                    : "border-l-2 border-l-transparent hover:bg-muted/40 ") +
                  "w-full text-left px-3 py-3 border-b border-border flex gap-3 items-start"
                }
              >
                <Avatar name={p.nama} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-fg text-sm truncate flex-1">{p.nama}</span>
                    <span className="text-[10px] text-muted-fg shrink-0 tabular-nums">
                      {formatWaktu(p.submitted_at ?? p.creation)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-fg truncate">
                    {stripHtml(p.pesan ?? "") || p.email || "—"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge tone={STATUS_TONE[p.status ?? "Baru"] ?? "neutral"} dot>
                      {p.status ?? "Baru"}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

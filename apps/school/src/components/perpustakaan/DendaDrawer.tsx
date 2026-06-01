/**
 * DendaDrawer — inline viewer for Denda Perpustakaan rows tied to one Peminjaman.
 *
 * Reference: PERP-ADR-0001 (Perpustakaan Sirkulasi Merge). Replaces the standalone
 * `/perpustakaan/denda` route: denda are now read & paid from the peminjaman context.
 * The "Tandai Lunas" action issues PATCH status_bayar=Lunas (+ tanggal_lunas=today)
 * and invalidates the list cache so the parent row + drawer refresh.
 */
import { Badge, Button, Modal } from "@sekolahpro/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useResourceList, updateResource } from "@sekolahpro/api-client";
import { perpToday, perpFormatRupiah } from "./perpFormatters";

const DOCTYPE = "Denda Perpustakaan";
const STATUS_BELUM_LUNAS = "Belum Lunas" as const;
const STATUS_LUNAS = "Lunas" as const;
const RESOURCE_LIST_KEY = "resource:list" as const;
const FIELDS = [
  "name",
  "peminjaman",
  "hari_terlambat",
  "denda_per_hari",
  "total_denda",
  "status_bayar",
];
const LIST_LIMIT = 50;

type StatusBayar = typeof STATUS_BELUM_LUNAS | typeof STATUS_LUNAS;

interface DendaRow {
  name: string;
  peminjaman?: string;
  hari_terlambat?: number;
  denda_per_hari?: number;
  total_denda?: number;
  status_bayar?: StatusBayar;
}

interface Props {
  open: boolean;
  peminjaman: string;
  onClose: () => void;
}

/** Single denda <li>: identity, breakdown, status badge, and (optional) pay button. */
function DendaRowItem({
  row,
  onPay,
  paying,
}: {
  row: DendaRow;
  onPay: (name: string) => void;
  paying: boolean;
}) {
  return (
    <li className="py-3 flex items-center justify-between gap-4">
      <div className="text-sm space-y-1">
        <div className="font-mono text-xs text-muted-fg">{row.name}</div>
        <div>
          {row.hari_terlambat ?? 0} hari × {perpFormatRupiah(row.denda_per_hari)} ={" "}
          <strong>{perpFormatRupiah(row.total_denda)}</strong>
        </div>
        <Badge tone={row.status_bayar === STATUS_LUNAS ? "success" : "warning"} dot>
          {row.status_bayar ?? "—"}
        </Badge>
      </div>
      {row.status_bayar === STATUS_BELUM_LUNAS && (
        <Button size="sm" onClick={() => onPay(row.name)} disabled={paying}>
          Tandai Lunas
        </Button>
      )}
    </li>
  );
}

/**
 * Renders denda rows for `peminjaman` inside a Modal, with a per-row
 * "Tandai Lunas" mutation when status_bayar === "Belum Lunas".
 */
export function DendaDrawer({ open, peminjaman, onClose }: Props) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useResourceList<DendaRow>(DOCTYPE, {
    filters: [["peminjaman", "=", peminjaman]],
    fields: FIELDS,
    limit_page_length: LIST_LIMIT,
  });

  const lunasMut = useMutation<unknown, Error, string>({
    mutationFn: (name) =>
      updateResource(DOCTYPE, name, {
        status_bayar: STATUS_LUNAS,
        tanggal_lunas: perpToday(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RESOURCE_LIST_KEY, DOCTYPE] });
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Denda Peminjaman" size="md">
      {isLoading && <p className="text-sm text-muted-fg">Memuat…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-sm text-muted-fg">Tidak ada denda untuk peminjaman ini.</p>
      )}
      <ul className="divide-y divide-border">
        {data.map((d) => (
          <DendaRowItem
            key={d.name}
            row={d}
            onPay={(n) => lunasMut.mutate(n)}
            paying={lunasMut.isPending}
          />
        ))}
      </ul>
    </Modal>
  );
}

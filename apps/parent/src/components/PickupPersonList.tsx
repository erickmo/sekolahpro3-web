import { Button } from "@sekolahpro/ui";
import type { PickupPerson } from "../data/pickup-types";

interface Props {
  persons: PickupPerson[];
  loading?: boolean;
  onIssueToken?: (person: PickupPerson) => void;
  onEdit?: (person: PickupPerson) => void;
  onRevoke?: (person: PickupPerson) => void;
}

export function PickupPersonList({
  persons,
  loading = false,
  onIssueToken,
  onEdit,
  onRevoke,
}: Props) {
  if (loading) {
    return <div className="text-sm text-muted-fg">Memuat daftar penjemput...</div>;
  }
  if (persons.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
        Belum ada penjemput terdaftar. Tambahkan penjemput untuk membuat kode QR.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-bg">
      {persons.map((p) => (
        <li
          key={p.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-fg">
              {p.nama.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-fg">
                {p.nama}
                {!p.isActive ? (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-fg">
                    Dicabut
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-muted-fg">
                {p.hubungan} · {p.phone}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {p.isActive && onIssueToken ? (
              <Button size="sm" onClick={() => onIssueToken(p)}>
                Buat QR
              </Button>
            ) : null}
            {onEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                Ubah
              </Button>
            ) : null}
            {p.isActive && onRevoke ? (
              <Button size="sm" variant="destructive" onClick={() => onRevoke(p)}>
                Cabut
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

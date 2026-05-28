/**
 * Inventaris — umbrella tab untuk audit koleksi.
 * Sub-section: Stock Opname (audit terjadwal) + Berita Acara Kerusakan (ad-hoc).
 * Internal segmented control supaya hemat tab utama Perpustakaan.
 */
import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";

const SEGMENTS: { to: string; label: string }[] = [
  { to: "/perpustakaan/inventaris/opname", label: "Stock Opname" },
  { to: "/perpustakaan/inventaris/berita-acara", label: "Berita Acara Kerusakan" },
];

function InventarisLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        {SEGMENTS.map((s) => {
          const active = pathname === s.to || pathname.startsWith(s.to + "/");
          return (
            <Link
              key={s.to}
              to={s.to}
              className={
                "rounded px-3 py-1.5 text-sm transition " +
                (active ? "bg-brand text-white" : "text-muted-fg hover:text-fg")
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/perpustakaan/inventaris")({
  component: InventarisLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/perpustakaan/inventaris" || location.pathname === "/perpustakaan/inventaris/") {
      throw redirect({ to: "/perpustakaan/inventaris/opname" });
    }
  },
});

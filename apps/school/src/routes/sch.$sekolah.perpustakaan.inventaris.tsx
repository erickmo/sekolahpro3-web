/**
 * Inventaris — umbrella tab untuk audit koleksi.
 * Sub-section: Stock Opname (audit terjadwal) + Berita Acara Kerusakan (ad-hoc).
 * Internal segmented control supaya hemat tab utama Perpustakaan.
 */
import { createFileRoute, Link, Outlet, redirect, useParams, useRouterState } from "@tanstack/react-router";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";
import { INVENTARIS_SEGMENTS, isSegmentActive } from "../components/perpustakaan/inventarisNav";

function InventarisLayout() {
  // $sekolah must be threaded into both the <Link> params and the active check;
  // the segment `to` templates carry the param. PERP-GAP-03
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <PerpPageGuide id="inventaris" />
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        {INVENTARIS_SEGMENTS.map((s) => {
          const active = isSegmentActive(pathname, s.to, sekolah);
          return (
            <Link
              key={s.to}
              to={s.to}
              params={{ sekolah }}
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

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/inventaris")({
  component: InventarisLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname === "/sch/$sekolah/perpustakaan/inventaris" || location.pathname === "/sch/$sekolah/perpustakaan/inventaris/") {
      throw redirect({ to: "/sch/$sekolah/perpustakaan/inventaris/opname", params: { sekolah: params.sekolah } });
    }
  },
});

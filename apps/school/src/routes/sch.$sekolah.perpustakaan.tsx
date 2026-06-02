/**
 * Perpustakaan module layout: sticky role-framed context bar + workflow-grouped
 * sub-navigation (Operasi Harian first), rendering the active sub-route via Outlet.
 * Sirkulasi (pinjam/kembali/denda) is unified under Peminjaman per PERP-ADR-0001.
 */
import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { IconBook } from "@sekolahpro/ui";
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleHeader } from "../components/ModuleHeader";
import { PerpustakaanContextBar } from "../components/perpustakaan/PerpustakaanContextBar";

// Navigation reorganized around the circulation staff's day, not the data model:
// the things done every hour (Operasi Harian) come first, collection upkeep and
// back-office tasks follow. Pengembalian + Denda are NOT separate tabs — per
// PERP-ADR-0001 they are views of the unified Peminjaman hub (filtered), reached
// from the dashboard's attention list and the hub's own filters.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Operasi Harian",
    items: [
      { to: "/sch/$sekolah/perpustakaan", label: "Dashboard", exact: true },
      { to: "/sch/$sekolah/perpustakaan/terminal", label: "Terminal" },
      { to: "/sch/$sekolah/perpustakaan/peminjaman", label: "Peminjaman" },
      { to: "/sch/$sekolah/perpustakaan/reservasi", label: "Reservasi" },
    ],
  },
  {
    label: "Koleksi",
    items: [
      { to: "/sch/$sekolah/perpustakaan/daftar", label: "Katalog Buku" },
      { to: "/sch/$sekolah/perpustakaan/kategori", label: "Kategori" },
      { to: "/sch/$sekolah/perpustakaan/inventaris", label: "Inventaris" },
    ],
  },
  {
    label: "Pengadaan & Anggota",
    items: [
      { to: "/sch/$sekolah/perpustakaan/pengadaan", label: "Pengadaan" },
      { to: "/sch/$sekolah/perpustakaan/anggota", label: "Anggota" },
    ],
  },
  {
    label: "Laporan",
    items: [{ to: "/sch/$sekolah/perpustakaan/laporan", label: "Laporan" }],
  },
];

function PerpustakaanLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  // Primary action for the daily desk: jump straight to the scan terminal.
  const terminalCta = (
    <Link
      to="/sch/$sekolah/perpustakaan/terminal"
      params={{ sekolah }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
    >
      <span className="h-4 w-4">
        <IconBook />
      </span>
      Buka Terminal Sirkulasi
    </Link>
  );

  return (
    <div className="space-y-4">
      <ModuleHeader
        context={<PerpustakaanContextBar cta={terminalCta} />}
        nav={<GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} variant="header" />}
      />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan")({ component: PerpustakaanLayout });

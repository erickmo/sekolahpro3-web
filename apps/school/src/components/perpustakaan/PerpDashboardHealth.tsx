/**
 * Perpustakaan dashboard — operations flow & quick-links block (presentational).
 *
 * Renders the end-to-end module flow (pengadaan → sirkulasi), the "Aksi Cepat"
 * shortcut grid, and the catalog footer tip. These are static navigation aids;
 * the only dynamic input is the resolved `$sekolah` segment used to scope every
 * router link. No data fetching or business logic.
 */
import { Link } from "@tanstack/react-router";
import {
  SectionCard,
  ModuleFlow,
  IconBook,
  IconWallet,
  IconAlert,
  IconCheck,
  IconUsers,
  IconChart,
  IconClock,
  IconArrowLeft,
  type ModuleFlowStep,
} from "@sekolahpro/ui";

/** Ordered operational steps from collection setup to circulation. */
const PERPUS_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "kategori", label: "Kategori", hint: "Setup kategori koleksi", href: "/sch/$sekolah/perpustakaan/kategori" },
  { key: "pengadaan", label: "Pengadaan", hint: "Beli koleksi baru", href: "/sch/$sekolah/perpustakaan/pengadaan" },
  { key: "inventaris", label: "Inventaris", hint: "Catat & opname stok", href: "/sch/$sekolah/perpustakaan/inventaris" },
  { key: "anggota", label: "Anggota", hint: "Daftar peminjam", href: "/sch/$sekolah/perpustakaan/anggota" },
  { key: "peminjaman", label: "Peminjaman", hint: "Transaksi pinjam", href: "/sch/$sekolah/perpustakaan/peminjaman" },
  { key: "pengembalian", label: "Pengembalian", hint: "Terima kembali", href: "/sch/$sekolah/perpustakaan/pengembalian" },
  { key: "denda", label: "Denda", hint: "Tagih keterlambatan", href: "/sch/$sekolah/perpustakaan/denda" },
];

/** Shortcut tiles to the modules used most often from the desk. */
const QUICK_ACTIONS: { to: string; label: string; description: string; icon: React.ReactNode }[] = [
  { to: "/sch/$sekolah/perpustakaan/terminal", label: "Terminal RFID", description: "Mode kios scan kartu + eksemplar.", icon: <IconBook className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/peminjaman", label: "Peminjaman", description: "Catat peminjaman individu / kolektif.", icon: <IconCheck className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/reservasi", label: "Reservasi", description: "Kelola antrian reservasi buku.", icon: <IconClock className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/pengadaan", label: "Pengadaan", description: "Pembelian / hibah / sumbangan koleksi.", icon: <IconWallet className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/inventaris/opname", label: "Stock Opname", description: "Audit inventaris via scan.", icon: <IconChart className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara", label: "BA Kerusakan", description: "Insiden rusak / hilang per eksemplar.", icon: <IconAlert className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/anggota", label: "Anggota", description: "Kelola data anggota perpustakaan.", icon: <IconUsers className="h-5 w-5" /> },
  { to: "/sch/$sekolah/perpustakaan/laporan", label: "Laporan", description: "Ringkasan sirkulasi & koleksi.", icon: <IconChart className="h-5 w-5" /> },
];

/**
 * Operations flow, quick-action grid, and the catalog tip footer. `sekolah`
 * scopes every router link so the raw `$sekolah` template never 404s.
 */
export function PerpDashboardHealth({ sekolah }: { sekolah: string }) {
  return (
    <>
      <ModuleFlow
        title="Alur Operasi Perpustakaan"
        description="Langkah dari pengadaan koleksi sampai sirkulasi pinjam."
        steps={PERPUS_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/perpustakaan/kategori"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard title="Aksi Cepat" description="Lompat ke modul yang sering digunakan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-brand hover:bg-muted/40"
            >
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-fg group-hover:text-brand">
                {a.icon}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg">{a.label}</div>
                <div className="text-xs text-muted-fg">{a.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-muted-fg">
        Tip: buka{" "}
        <Link to="/sch/$sekolah/perpustakaan/daftar" params={{ sekolah }} className="text-brand hover:underline inline-flex items-center gap-1">
          <IconArrowLeft className="h-3 w-3 shrink-0" />
          katalog buku lengkap
        </Link>
        {" "}untuk mencari atau menambahkan koleksi baru.
      </p>
    </>
  );
}

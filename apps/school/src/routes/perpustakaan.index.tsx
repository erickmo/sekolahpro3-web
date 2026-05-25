import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconWallet,
  IconAlert,
  IconCheck,
  IconUsers,
  IconChart,
  IconClock,
  IconArrowLeft,
} from "@sekolahpro/ui";
import type { AttentionItem } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

type BukuRow = {
  name: string;
  judul?: string;
  pengarang?: string;
  kategori?: string;
  tahun_terbit?: number;
};

type PeminjamanRow = {
  name: string;
  anggota?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  status?: string;
};

const QUICK_ACTIONS: { to: string; label: string; description: string; icon: React.ReactNode }[] = [
  { to: "/perpustakaan/peminjaman", label: "Peminjaman", description: "Catat peminjaman buku baru.", icon: <IconBook /> },
  { to: "/perpustakaan/pengembalian", label: "Pengembalian", description: "Proses pengembalian dan pemeriksaan kondisi.", icon: <IconCheck /> },
  { to: "/perpustakaan/reservasi", label: "Reservasi", description: "Kelola antrian dan reservasi buku.", icon: <IconClock /> },
  { to: "/perpustakaan/denda", label: "Denda", description: "Tagih dan kelola denda peminjam.", icon: <IconWallet /> },
  { to: "/perpustakaan/anggota", label: "Anggota", description: "Kelola data anggota perpustakaan.", icon: <IconUsers /> },
  { to: "/perpustakaan/laporan", label: "Laporan", description: "Lihat ringkasan sirkulasi dan koleksi.", icon: <IconChart /> },
];

const PINJAM_TONE: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

function PerpustakaanDashboardPage() {
  const bukuQ = useResourceList<BukuRow>("Buku", {
    fields: ["name", "judul", "pengarang", "kategori", "tahun_terbit"],
    limit_page_length: 0,
  });

  const pinjamQ = useResourceList<PeminjamanRow>("Peminjaman Buku", {
    fields: ["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"],
    order_by: "`tanggal_pinjam` desc",
    limit_page_length: 200,
  });

  const buku = bukuQ.data ?? [];
  const pinjam = pinjamQ.data ?? [];

  const TODAY = "2026-05-25";

  const stats = useMemo(() => {
    const totalJudul = buku.length;
    const aktif = pinjam.filter((p) => p.status === "Aktif").length;
    const terlambat = pinjam.filter((p) => p.status === "Terlambat").length;
    // Actionable: buku jatuh tempo hari ini (dueDate == TODAY) — masih Aktif.
    const jatuhTempoHariIni = pinjam.filter(
      (p) => p.status === "Aktif" && p.tanggal_kembali_rencana === TODAY,
    ).length;
    // TODO(api): denda agregat dari `Denda Perpustakaan` (status != Lunas).
    return { totalJudul, aktif, terlambat, jatuhTempoHariIni };
  }, [buku, pinjam]);

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    for (const p of pinjam) {
      if (p.status === "Terlambat") {
        items.push({
          id: `terlambat-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · jatuh tempo ${p.tanggal_kembali_rencana ?? "—"}`,
          tone: "warning",
          badge: "Terlambat",
          actionLabel: "Kirim Pengingat",
          actionHref: "/perpustakaan/peminjaman",
        });
      } else if (p.status === "Hilang") {
        items.push({
          id: `hilang-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · buku hilang — butuh penggantian`,
          tone: "danger",
          badge: "Hilang",
          actionLabel: "Buat Denda",
          actionHref: "/perpustakaan/denda",
        });
      } else if (p.status === "Aktif" && p.tanggal_kembali_rencana === TODAY) {
        items.push({
          id: `due-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · jatuh tempo hari ini`,
          tone: "neutral",
          actionLabel: "Cek Peminjaman",
          actionHref: "/perpustakaan/peminjaman",
        });
      }
    }
    return items;
  }, [pinjam]);

  const aktivitasTerbaru = useMemo(() => pinjam.slice(0, 5), [pinjam]);

  const isZeroState = !bukuQ.isLoading && !bukuQ.isError && buku.length === 0;

  if (isZeroState) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Layanan"
          title="Dashboard Perpustakaan"
          description="Ringkasan koleksi, sirkulasi, dan tindakan cepat untuk operasional harian."
        />
        <GettingStartedCard
          icon={<IconBook />}
          title="Perpustakaan belum punya koleksi"
          description="Input buku pertama atau import katalog untuk mulai layanan peminjaman."
          primaryAction={{ label: "Tambah Buku", href: "/perpustakaan/daftar" }}
          renderLink={(href, children, className) => (
            <Link to={href} className={className}>
              {children}
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Layanan"
        title="Dashboard Perpustakaan"
        description="Ringkasan koleksi, sirkulasi, dan tindakan cepat untuk operasional harian."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Buku Jatuh Tempo Hari Ini"
          value={stats.jatuhTempoHariIni.toLocaleString("id-ID")}
          hint={pinjamQ.isLoading ? "memuat..." : "hubungi peminjam"}
          icon={<IconBook />}
          accent="amber"
          urgency="warn"
          actionHref="/perpustakaan/peminjaman"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Peminjaman Aktif"
          value={stats.aktif.toLocaleString("id-ID")}
          hint="sedang berjalan"
          icon={<IconWallet />}
          accent="violet"
          urgency="normal"
        />
        <StatCard
          label="Terlambat"
          value={stats.terlambat.toLocaleString("id-ID")}
          hint="perlu tindak lanjut"
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/perpustakaan/peminjaman"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Denda Belum Dibayar"
          value="—"
          hint="butuh agregasi backend"
          icon={<IconCheck />}
          accent="amber"
          urgency="warn"
          actionHref="/perpustakaan/denda"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Lompat ke modul yang sering digunakan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-brand hover:bg-muted/40"
            >
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-fg group-hover:text-brand">
                <span className="h-5 w-5">{a.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg">{a.label}</div>
                <div className="text-xs text-muted-fg">{a.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Peminjaman terlambat, hilang, atau jatuh tempo hari ini."
          action={
            <Link to="/perpustakaan/denda" className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <AttentionList
              items={perluPerhatianItems}
              maxItems={5}
              renderLink={(href, children, className) => (
                <Link to={href} className={className}>
                  {children}
                </Link>
              )}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="5 peminjaman terakhir tercatat."
          action={
            <Link to="/perpustakaan/peminjaman" className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : aktivitasTerbaru.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
              Belum ada aktivitas peminjaman.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {aktivitasTerbaru.map((p) => (
                <li key={p.name} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{p.name}</div>
                    <div className="text-xs text-muted-fg truncate">{p.anggota ?? "—"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs tabular-nums text-muted-fg">{p.tanggal_pinjam ?? "—"}</span>
                    <Badge tone={PINJAM_TONE[p.status ?? ""] ?? "neutral"} dot>
                      {p.status ?? "—"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <p className="text-xs text-muted-fg">
        Tip: buka{" "}
        <Link to="/perpustakaan/daftar" className="text-brand hover:underline inline-flex items-center gap-1">
          <span className="h-3 w-3"><IconArrowLeft /></span>
          katalog buku lengkap
        </Link>
        {" "}untuk mencari atau menambahkan koleksi baru.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/perpustakaan/")({ component: PerpustakaanDashboardPage });

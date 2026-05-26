import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Alert,
  Badge,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  Skeleton,
  SkeletonText,
  StatCard,
  IconUsers,
  IconWallet,
  IconChart,
  IconAlert,
  IconFile,
  IconId,
  IconCheck,
  IconSettings,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

/**
 * Dashboard Koperasi.
 *
 * Audit UX 2026-05-26:
 *   - Hapus `SALDO_KAS_STUB` (hard-coded) — supervisor tidak boleh sign-off
 *     dari angka palsu. Saldo kas wajib dari GL backend, belum siap.
 *   - Hapus `KAS_TELLER_BELUM_CLOSING_STUB` (= 1) — gantikan dengan query nyata.
 *   - Hapus agregasi dari mock `ANGGOTA_LIST` — UI tidak ikut me-mock data.
 *
 * Yang masih ditampilkan = data yang otoritatif (count Anggota Koperasi
 * status=Aktif + count Sesi Kas Teller status=Aktif). Kartu lain dipindah ke
 * placeholder agar tidak menyesatkan.
 */

type AnggotaRow = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  status?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
};

type SesiAktifRow = { name: string };

const QUICK_ACTIONS: {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  { to: "/koperasi/transaksi", label: "Transaksi", description: "Setor, tarik, dan transaksi simpanan.", icon: <IconWallet /> },
  { to: "/koperasi/pembiayaan", label: "Pembiayaan", description: "Pengajuan dan pencairan pinjaman.", icon: <IconFile /> },
  { to: "/koperasi/angsuran", label: "Angsuran", description: "Pembayaran cicilan pinjaman anggota.", icon: <IconChart /> },
  { to: "/koperasi/rekening", label: "Rekening", description: "Kelola rekening simpanan anggota.", icon: <IconId /> },
  { to: "/koperasi/kartu", label: "Kartu RFID", description: "Pengelolaan kartu anggota.", icon: <IconId /> },
  { to: "/koperasi/emoney", label: "E-Money", description: "Saldo dan top up e-money.", icon: <IconWallet /> },
  { to: "/koperasi/kas-teller", label: "Kas Teller", description: "Pembukaan dan tutup kas harian.", icon: <IconWallet /> },
  { to: "/koperasi/persetujuan", label: "Persetujuan", description: "Approval permohonan supervisor.", icon: <IconCheck /> },
  { to: "/koperasi/zis", label: "ZIS", description: "Zakat, Infak, dan Sedekah.", icon: <IconCheck /> },
  { to: "/koperasi/wakaf", label: "Wakaf", description: "Catatan program wakaf.", icon: <IconCheck /> },
  { to: "/koperasi/shu", label: "SHU", description: "Sisa Hasil Usaha tahunan.", icon: <IconChart /> },
  { to: "/koperasi/pengaturan", label: "Pengaturan", description: "Konfigurasi modul koperasi.", icon: <IconSettings /> },
];

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  Aktif: "success",
  "Non-aktif": "neutral",
  Keluar: "danger",
  Pending: "warning",
};

function KoperasiDashboardPage() {
  const anggotaQ = useResourceList<AnggotaRow>("Anggota Koperasi", {
    fields: ["name", "nomor_anggota", "nasabah", "status", "jenis_anggota", "tanggal_masuk"],
    limit_page_length: 0,
  });

  // Sesi Kas Teller yang belum di-closing — otoritatif (BUKAN stub).
  const sesiAktifQ = useResourceList<SesiAktifRow>("Sesi Kas Teller", {
    fields: ["name"],
    filters: [["status", "=", "Aktif"]],
    limit_page_length: 50,
  });

  const rows = anggotaQ.data ?? [];

  const stats = useMemo(() => {
    const aktif = rows.filter((a) => a.status === "Aktif").length;
    const kasTellerBelumClosing = sesiAktifQ.data?.length ?? 0;
    return { aktif, kasTellerBelumClosing };
  }, [rows, sesiAktifQ.data]);

  const isZeroState = !anggotaQ.isLoading && !anggotaQ.isError && rows.length === 0;

  const terbaru = useMemo(() => {
    return [...rows]
      .filter((r) => r.tanggal_masuk)
      .sort((a, b) => (a.tanggal_masuk! < b.tanggal_masuk! ? 1 : -1))
      .slice(0, 5);
  }, [rows]);

  if (isZeroState) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Layanan"
          title="Dashboard Koperasi"
          description="Ringkasan koperasi sekolah, aksi cepat, dan hal yang perlu ditindaklanjuti."
        />
        <GettingStartedCard
          icon={<IconUsers />}
          title="Koperasi belum dikonfigurasi"
          description="Tambah anggota koperasi pertama dan buka kas teller untuk mulai mencatat transaksi."
          primaryAction={{ label: "Tambah Anggota", href: "/koperasi/daftar" }}
          secondaryAction={{ label: "Buka Kas Teller", href: "/koperasi/kas-teller" }}
          renderLink={(href, children, className) => (
            <Link to={href as "/koperasi/daftar"} className={className}>
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
        title="Dashboard Koperasi"
        description="Ringkasan koperasi sekolah, aksi cepat, dan hal yang perlu ditindaklanjuti."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Anggota (Aktif)"
          value={anggotaQ.isLoading ? "…" : stats.aktif.toLocaleString("id-ID")}
          {...(anggotaQ.isLoading ? { hint: "memuat..." } : { hint: "status = Aktif" })}
          icon={<IconUsers />}
          accent="brand"
          urgency="normal"
          actionHref="/koperasi/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Kas Teller Belum Closing"
          value={sesiAktifQ.isLoading ? "…" : stats.kasTellerBelumClosing.toLocaleString("id-ID")}
          hint={
            stats.kasTellerBelumClosing > 0
              ? "wajib tutup kas hari ini"
              : "semua teller sudah closing"
          }
          icon={<IconAlert />}
          accent="amber"
          urgency={stats.kasTellerBelumClosing > 0 ? "critical" : "normal"}
          actionHref="/koperasi/kas-teller"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Saldo Kas (GL)"
          value="—"
          hint="Belum tersedia: butuh integrasi akun kas GL backend."
          icon={<IconWallet />}
          accent="emerald"
          urgency="normal"
        />
      </div>

      <Alert tone="info" statusRole>
        Metrik <strong>Volume Transaksi Hari Ini</strong>, <strong>Pinjaman Macet</strong>, dan{" "}
        <strong>Saldo Kas GL</strong> sedang menunggu endpoint agregasi backend. Sementara tidak ditampilkan
        agar tidak menyesatkan keputusan supervisor.
      </Alert>

      <SectionCard
        title="Aksi Cepat"
        description="Pintasan ke modul-modul koperasi yang umum digunakan."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 hover:border-brand hover:bg-muted/30 transition-colors"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                {q.icon}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg group-hover:text-brand">{q.label}</div>
                <div className="text-xs text-muted-fg">{q.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Anggota Terbaru"
        description="5 keanggotaan terakhir tercatat."
        action={
          <Link to="/koperasi/daftar" className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {anggotaQ.isLoading ? (
          <SkeletonText lines={5} aria-label="Memuat anggota terbaru" />
        ) : terbaru.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada anggota.</div>
        ) : (
          <ul className="divide-y divide-border -my-2">
            {terbaru.map((a) => (
              <li key={a.name} className="py-2.5 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" aria-label="avatar" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-fg truncate">
                    {a.nasabah ?? a.nomor_anggota ?? a.name}
                  </div>
                  <div className="text-xs text-muted-fg truncate tabular-nums">
                    {a.nomor_anggota ?? a.name} · {a.jenis_anggota ?? "—"}
                  </div>
                </div>
                {a.status ? (
                  <Badge tone={STATUS_TONE[a.status] ?? "neutral"} dot>
                    {a.status}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {anggotaQ.isError ? (
        <Alert tone="danger" title="Gagal memuat anggota">
          {(anggotaQ.error as Error).message}
        </Alert>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/koperasi/")({ component: KoperasiDashboardPage });

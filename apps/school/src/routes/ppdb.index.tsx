import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Avatar,
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconWallet,
  IconCalendar,
  IconSettings,
  IconGrad,
  GlossaryTooltip,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";
import { PPDB_LIST } from "../data/ppdb";

// Konstanta agregasi PPDB — STUB sampai backend wired.
// TODO(api): ganti dengan field `kuota` di doctype Gelombang PPDB.
const KUOTA_GELOMBANG_AKTIF_STUB = 200;
// TODO(api): ganti dengan field `tanggal_tutup` di doctype Gelombang PPDB.
const GELOMBANG_DEADLINE_ISO = "2026-06-30";
const TODAY_ISO = "2026-05-25";
const HARI_TUNGGAKAN_THRESHOLD = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function hariTersisa(deadlineIso: string, todayIso: string): number {
  const d = new Date(deadlineIso).getTime();
  const t = new Date(todayIso).getTime();
  if (Number.isNaN(d) || Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((d - t) / MS_PER_DAY));
}

function umurHari(tanggalIso: string, todayIso: string): number {
  const d = new Date(tanggalIso).getTime();
  const t = new Date(todayIso).getTime();
  if (Number.isNaN(d) || Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((t - d) / MS_PER_DAY));
}

// Real "Pendaftaran PPDB" fields (verified from doctype JSON).
type PendaftaranRow = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
};

const PENDAFTARAN_FIELDS = [
  "name",
  "status",
  "gelombang_ppdb",
  "calon_siswa",
  "tanggal_daftar",
];

const LOLOS_STATUSES = new Set(["Lulus", "Daftar Ulang", "Diterima"]);
const RECENT_LIMIT = 5;

type QuickAction = {
  to: "/ppdb/calon-siswa" | "/ppdb/seleksi" | "/ppdb/pembayaran" | "/ppdb/daftar-ulang" | "/ppdb/gelombang" | "/ppdb/pengaturan";
  label: string;
  description: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  { to: "/ppdb/calon-siswa", label: "Calon Siswa", description: "Kelola data pendaftar baru", icon: <IconUsers /> },
  { to: "/ppdb/seleksi", label: "Seleksi", description: "Jadwal & hasil seleksi", icon: <IconCheck /> },
  { to: "/ppdb/pembayaran", label: "Pembayaran", description: "Verifikasi pembayaran PPDB", icon: <IconWallet /> },
  { to: "/ppdb/daftar-ulang", label: "Daftar Ulang", description: "Konfirmasi peserta diterima", icon: <IconGrad /> },
  { to: "/ppdb/gelombang", label: "Gelombang", description: "Atur gelombang & kuota", icon: <IconCalendar /> },
  { to: "/ppdb/pengaturan", label: "Pengaturan", description: "Konfigurasi modul PPDB", icon: <IconSettings /> },
];

const TONE_BY_STATUS: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Diterima: "success",
  Lulus: "success",
  Verifikasi: "brand",
  Tes: "brand",
  "Daftar Ulang": "brand",
  "Tidak Lulus": "danger",
  "Mengundurkan Diri": "danger",
  Draft: "neutral",
  Terkirim: "warning",
};

function PpdbDashboard() {
  const pendaftaranQ = useResourceList<PendaftaranRow>("Pendaftaran PPDB", {
    fields: PENDAFTARAN_FIELDS,
    order_by: "`tanggal_daftar` desc",
    limit_page_length: 0,
  });

  const rows = pendaftaranQ.data ?? [];

  const stats = useMemo(() => {
    const total = rows.length;
    const lolos = rows.filter((p) => p.status && LOLOS_STATUSES.has(p.status)).length;

    // Sisa kuota gelombang aktif — kuota - pendaftar terdaftar.
    // STUB kuota karena belum ada field di backend.
    const sisaKuota = Math.max(0, KUOTA_GELOMBANG_AKTIF_STUB - total);
    const persentaseSisa = (sisaKuota / KUOTA_GELOMBANG_AKTIF_STUB) * 100;

    // Pembayaran pending — derive dari mock PPDB_LIST. Sesuaikan saat
    // doctype "Pembayaran PPDB" wired ke backend.
    // TODO(api): pakai useResourceList("Pembayaran PPDB", { status: "Tertunda" })
    const tagihanTertunda = PPDB_LIST.flatMap((p) =>
      p.pembayaran
        .filter((bayar) => bayar.status === "Tertunda")
        .map((bayar) => ({ tanggal: bayar.tanggal, pendaftar: p.noPendaftaran })),
    );
    const pendaftarUnikTertunda = new Set(tagihanTertunda.map((t) => t.pendaftar));
    const pembayaranPendingCount = pendaftarUnikTertunda.size;
    const pendaftarTunggakanLama = new Set(
      tagihanTertunda
        .filter((t) => umurHari(t.tanggal, TODAY_ISO) > HARI_TUNGGAKAN_THRESHOLD)
        .map((t) => t.pendaftar),
    ).size;

    const hariTersisaGelombang = hariTersisa(GELOMBANG_DEADLINE_ISO, TODAY_ISO);

    return {
      total,
      lolos,
      sisaKuota,
      persentaseSisa,
      pembayaranPendingCount,
      pendaftarTunggakanLama,
      hariTersisaGelombang,
    };
  }, [rows]);

  const aktivitasTerbaru = useMemo(() => rows.slice(0, RECENT_LIMIT), [rows]);

  // Cross-menu signal — wire to backend aggregate when ready.
  // STUB count untuk "riwayat tunggakan" sampai endpoint cross-school siap.
  const RIWAYAT_TUNGGAKAN_STUB = 3;
  const PPDB_DOKUMEN_KURANG_STUB = 0;
  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (stats.pembayaranPendingCount > 0) {
      // Ambil pendaftar pertama dengan tunggakan untuk landing kontak.
      const firstPending = PPDB_LIST.find((p) =>
        p.pembayaran.some((b) => b.status === "Tertunda"),
      );
      items.push({
        id: "pembayaran-tertunda",
        label: `${stats.pembayaranPendingCount} pendaftar belum bayar`,
        description: firstPending ? `Mulai dari ${firstPending.noPendaftaran}` : "Belum melunasi biaya PPDB",
        tone: stats.pendaftarTunggakanLama > 0 ? "danger" : "warning",
        badge: "Bayar",
        actionLabel: "Hubungi Calon",
        actionHref: firstPending ? `/ppdb/${firstPending.noPendaftaran}` : "/ppdb/pembayaran",
      });
    }
    if (PPDB_DOKUMEN_KURANG_STUB > 0) {
      items.push({
        id: "dokumen-kurang",
        label: `${PPDB_DOKUMEN_KURANG_STUB} calon dokumen belum lengkap`,
        description: "Akta, KK, atau rapor belum diunggah",
        tone: "warning",
        badge: "Dokumen",
        actionLabel: "Minta Lengkap",
        actionHref: "/ppdb/calon-siswa",
      });
    }
    if (RIWAYAT_TUNGGAKAN_STUB > 0) {
      items.push({
        id: "riwayat-tunggakan",
        label: `${RIWAYAT_TUNGGAKAN_STUB} calon dengan riwayat tunggakan di sekolah asal`,
        description: "Cek histori keuangan sebelum diterima",
        tone: "warning",
        badge: "Riwayat",
        actionLabel: "Tinjau",
        actionHref: "/keuangan",
      });
    }
    return items;
  }, [stats.pembayaranPendingCount, stats.pendaftarTunggakanLama]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penerimaan"
        title="Dashboard PPDB"
        description={
          <>
            Ringkasan pendaftaran <GlossaryTooltip term="PPDB" definition={GLOSSARY.PPDB} /> tahun
            ajaran berjalan.
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sisa Kuota Gelombang Aktif"
          value={stats.sisaKuota.toLocaleString("id-ID")}
          hint={
            pendaftaranQ.isLoading
              ? "memuat..."
              : `dari kuota ${KUOTA_GELOMBANG_AKTIF_STUB.toLocaleString("id-ID")} (stub)`
          }
          icon={<IconUsers />}
          accent="brand"
          urgency={
            stats.persentaseSisa < 5
              ? "critical"
              : stats.persentaseSisa < 20
                ? "warn"
                : "normal"
          }
          actionHref="/ppdb/gelombang"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Lolos Seleksi"
          value={stats.lolos.toLocaleString("id-ID")}
          hint="lulus + diterima"
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
          actionHref="/ppdb/seleksi"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Pembayaran Pending"
          value={stats.pembayaranPendingCount.toLocaleString("id-ID")}
          hint={
            stats.pendaftarTunggakanLama > 0
              ? `${stats.pendaftarTunggakanLama} pendaftar >${HARI_TUNGGAKAN_THRESHOLD} hari`
              : "tidak ada tunggakan lama"
          }
          icon={<IconWallet />}
          accent="rose"
          urgency={stats.pendaftarTunggakanLama > 0 ? "critical" : "normal"}
          actionHref="/ppdb/pembayaran"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Hari Tersisa Gelombang"
          value={stats.hariTersisaGelombang.toLocaleString("id-ID")}
          hint={`deadline ${GELOMBANG_DEADLINE_ISO}`}
          icon={<IconCalendar />}
          accent="violet"
          urgency={stats.hariTersisaGelombang <= 14 ? "warn" : "normal"}
          actionHref="/ppdb/gelombang"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Buka modul PPDB lainnya.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand hover:bg-muted/30"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
                <span className="h-5 w-5">{q.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg group-hover:text-brand">{q.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{q.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Perlu Perhatian"
        description="Sinyal lintas modul untuk tim PPDB."
      >
        <AttentionList
          items={perluPerhatian}
          renderLink={(href, children) => <Link to={href as "/ppdb/calon-siswa"}>{children}</Link>}
        />
      </SectionCard>

      <SectionCard
        title="Aktivitas Terbaru"
        description="Pendaftaran terakhir."
        padded={false}
        action={
          <Link to="/ppdb/daftar" className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {pendaftaranQ.isLoading ? (
          <div className="px-5 py-8 text-sm text-muted-fg text-center">Memuat data...</div>
        ) : pendaftaranQ.isError ? (
          <div className="px-5 py-8 text-sm text-rose-600 text-center">Gagal memuat data.</div>
        ) : aktivitasTerbaru.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-fg text-center">Belum ada pendaftar.</div>
        ) : (
          <ul className="divide-y divide-border">
            {aktivitasTerbaru.map((p) => (
              <li key={p.name} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={p.calon_siswa ?? p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/ppdb/$noPendaftaran"
                    params={{ noPendaftaran: p.name }}
                    className="text-sm font-medium text-fg hover:text-brand truncate block"
                  >
                    {p.calon_siswa ?? p.name}
                  </Link>
                  <div className="text-xs text-muted-fg tabular-nums">
                    {p.name}
                    {p.gelombang_ppdb ? ` · ${p.gelombang_ppdb}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={TONE_BY_STATUS[p.status ?? ""] ?? "neutral"} dot>
                    {p.status ?? "—"}
                  </Badge>
                  {p.tanggal_daftar ? (
                    <div className="text-[11px] text-muted-fg mt-1">{p.tanggal_daftar}</div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="text-xs text-muted-fg">
        Tip: buka{" "}
        <Link to="/ppdb/daftar" className="text-brand hover:underline">
          Pendaftaran
        </Link>{" "}
        untuk daftar lengkap.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/ppdb/")({ component: PpdbDashboard });

import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Avatar,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconWallet,
  IconCalendar,
  IconSettings,
  IconGrad,
  IconPlus,
  GlossaryTooltip,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";
import { listPpdbForSekolah } from "../data/ppdb";
import { PIPELINE_STAGES } from "../lib/ppdbApi";

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
  to: "/$sekolah/ppdb/calon-siswa" | "/$sekolah/ppdb/seleksi" | "/$sekolah/ppdb/pembayaran" | "/$sekolah/ppdb/daftar-ulang" | "/$sekolah/ppdb/gelombang" | "/$sekolah/ppdb/pengaturan";
  label: string;
  description: string;
  icon: React.ReactNode;
};

const PPDB_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "tahun-ajaran", label: "Tahun Ajaran", hint: "Aktifkan TA berjalan", href: "/$sekolah/master/tahun-ajaran" },
  { key: "gelombang", label: "Gelombang", hint: "Atur kuota & periode", href: "/$sekolah/ppdb/gelombang" },
  { key: "pengaturan", label: "Pengaturan", hint: "Biaya, formulir, alur", href: "/$sekolah/ppdb/pengaturan" },
  { key: "calon", label: "Calon Siswa", hint: "Terima pendaftaran", href: "/$sekolah/ppdb/calon-siswa" },
  { key: "seleksi", label: "Seleksi", hint: "Jadwal & hasil", href: "/$sekolah/ppdb/seleksi" },
  { key: "pembayaran", label: "Pembayaran", hint: "Verifikasi tagihan", href: "/$sekolah/ppdb/pembayaran" },
  { key: "daftar-ulang", label: "Daftar Ulang", hint: "Konfirmasi diterima", href: "/$sekolah/ppdb/daftar-ulang" },
];

const QUICK_ACTIONS: QuickAction[] = [
  { to: "/$sekolah/ppdb/calon-siswa", label: "Calon Siswa", description: "Kelola data pendaftar baru", icon: <IconUsers /> },
  { to: "/$sekolah/ppdb/seleksi", label: "Seleksi", description: "Jadwal & hasil seleksi", icon: <IconCheck /> },
  { to: "/$sekolah/ppdb/pembayaran", label: "Pembayaran", description: "Verifikasi pembayaran PPDB", icon: <IconWallet /> },
  { to: "/$sekolah/ppdb/daftar-ulang", label: "Daftar Ulang", description: "Konfirmasi peserta diterima", icon: <IconGrad /> },
  { to: "/$sekolah/ppdb/gelombang", label: "Gelombang", description: "Atur gelombang & kuota", icon: <IconCalendar /> },
  { to: "/$sekolah/ppdb/pengaturan", label: "Pengaturan", description: "Konfigurasi modul PPDB", icon: <IconSettings /> },
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
  const { sekolah } = useParams({ from: "/$sekolah" });

  const pendaftaranQ = useResourceList<PendaftaranRow>("Pendaftaran PPDB", {
    fields: PENDAFTARAN_FIELDS,
    order_by: "`tanggal_daftar` desc",
    limit_page_length: 0,
  });

  const rows = pendaftaranQ.data ?? [];

  // Mock PPDB list, scoped ke active school slug.
  const ppdbMockList = useMemo(() => listPpdbForSekolah(sekolah), [sekolah]);

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
    const tagihanTertunda = ppdbMockList.flatMap((p) =>
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
  }, [rows, ppdbMockList]);

  const aktivitasTerbaru = useMemo(() => rows.slice(0, RECENT_LIMIT), [rows]);

  // Cross-menu signal — wire to backend aggregate when ready.
  // STUB count untuk "riwayat tunggakan" sampai endpoint cross-school siap.
  const RIWAYAT_TUNGGAKAN_STUB = 3;
  const PPDB_DOKUMEN_KURANG_STUB = 0;
  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (stats.pembayaranPendingCount > 0) {
      // Ambil pendaftar pertama dengan tunggakan untuk landing kontak.
      const firstPending = ppdbMockList.find((p) =>
        p.pembayaran.some((b) => b.status === "Tertunda"),
      );
      items.push({
        id: "pembayaran-tertunda",
        label: `${stats.pembayaranPendingCount} pendaftar belum bayar`,
        description: firstPending ? `Mulai dari ${firstPending.noPendaftaran}` : "Belum melunasi biaya PPDB",
        tone: stats.pendaftarTunggakanLama > 0 ? "danger" : "warning",
        badge: "Bayar",
        actionLabel: "Hubungi Calon",
        actionHref: firstPending ? `/ppdb/${firstPending.noPendaftaran}` : "/$sekolah/ppdb/pembayaran",
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
        actionHref: "/$sekolah/ppdb/calon-siswa",
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
        actionHref: "/$sekolah/keuangan",
      });
    }
    return items;
  }, [stats.pembayaranPendingCount, stats.pendaftarTunggakanLama, ppdbMockList]);

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
        actions={
          <Link to="/$sekolah/ppdb/buat" params={{ sekolah }}>
            <Button>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Buat Pendaftaran
            </Button>
          </Link>
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
          actionHref="/$sekolah/ppdb/gelombang"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Lolos Seleksi"
          value={stats.lolos.toLocaleString("id-ID")}
          hint="lulus + diterima"
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
          actionHref="/$sekolah/ppdb/seleksi"
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
          actionHref="/$sekolah/ppdb/pembayaran"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Hari Tersisa Gelombang"
          value={stats.hariTersisaGelombang.toLocaleString("id-ID")}
          hint={`deadline ${GELOMBANG_DEADLINE_ISO}`}
          icon={<IconCalendar />}
          accent="violet"
          urgency={stats.hariTersisaGelombang <= 14 ? "warn" : "normal"}
          actionHref="/$sekolah/ppdb/gelombang"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Buka PPDB Baru"
        description="Langkah membuka penerimaan: dari tahun ajaran sampai daftar ulang."
        steps={PPDB_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/$sekolah/ppdb/gelombang"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <PipelineFunnel rows={rows} loading={pendaftaranQ.isLoading} />

      <SectionCard title="Aksi Cepat" description="Buka modul PPDB lainnya.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              params={{ sekolah }}
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
          renderLink={(href, children) => <Link to={href as "/$sekolah/ppdb/calon-siswa"} params={{ sekolah }}>{children}</Link>}
        />
      </SectionCard>

      <SectionCard
        title="Aktivitas Terbaru"
        description="Pendaftaran terakhir."
        padded={false}
        action={
          <Link to="/$sekolah/ppdb/daftar" params={{ sekolah }} className="text-xs text-brand hover:underline">
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
                    to="/$sekolah/ppdb/$noPendaftaran"
                    params={{ sekolah, noPendaftaran: p.name }}
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
        <Link to="/$sekolah/ppdb/daftar" params={{ sekolah }} className="text-brand hover:underline">
          Pendaftaran
        </Link>{" "}
        untuk daftar lengkap.
      </p>
    </div>
  );
}

// Pipeline funnel — visualisasi jumlah pendaftar per stage, dipakai
// untuk pandangan Kepala Sekolah/Yayasan + panitia melihat bottleneck.
function PipelineFunnel({ rows, loading }: { rows: PendaftaranRow[]; loading: boolean }) {
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of PIPELINE_STAGES) out[s.key] = 0;
    for (const r of rows) {
      const k = r.status ?? "";
      if (k in out) out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [rows]);
  const max = Math.max(1, ...PIPELINE_STAGES.map((s) => counts[s.key] ?? 0));
  const total = rows.length;

  const TONE_BAR: Record<string, string> = {
    neutral: "bg-slate-400",
    warning: "bg-amber-500",
    brand: "bg-indigo-500",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
  };

  return (
    <SectionCard
      title="Pipeline PPDB"
      description={`Distribusi ${total.toLocaleString("id-ID")} pendaftaran per tahap.`}
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-fg">Memuat...</div>
      ) : (
        <div className="space-y-2.5">
          {PIPELINE_STAGES.map((s) => {
            const c = counts[s.key] ?? 0;
            const pct = total ? Math.round((c / total) * 100) : 0;
            const barPct = Math.round((c / max) * 100);
            return (
              <div key={s.key} className="grid grid-cols-[160px_1fr_90px] items-center gap-3">
                <div className="text-xs font-medium text-fg">{s.label}</div>
                <div className="h-7 overflow-hidden rounded-md bg-muted">
                  <div
                    className={`h-full ${TONE_BAR[s.tone] ?? "bg-slate-400"} transition-all`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="text-right tabular-nums text-xs">
                  <strong>{c.toLocaleString("id-ID")}</strong>
                  <span className="text-muted-fg"> · {pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export const Route = createFileRoute("/$sekolah/ppdb/")({ component: PpdbDashboard });

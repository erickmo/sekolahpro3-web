/**
 * Beranda PPDB — landing role-adaptive untuk modul Penerimaan Peserta Didik Baru.
 *
 * Satu halaman, dua view yang dipilih lewat segmented toggle:
 *  - "Ringkasan"     : orientasi manajer (KPI + visualisasi + perhatian).
 *  - "Antrian Kerja" : orientasi staff (apa yang harus dikerjakan hari ini).
 *
 * View awal mengikuti usePpdbRole().primary (manajer → Ringkasan, staff →
 * Antrian Kerja); pengguna tetap bebas berpindah — peran hanya petunjuk framing,
 * bukan gerbang akses. Semua agregasi dihitung di lib (ppdbAnalytics/ppdbQueue);
 * body view diekstrak ke components/ppdb/berandaPanel agar file ini < 300 baris.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  type AttentionItem,
  Button,
  PageHeader,
  GlossaryTooltip,
  IconPlus,
  cn,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";
import { listPpdbForSekolah } from "../data/ppdb";
import { usePpdbRole } from "../lib/ppdbRole";
import {
  funnelData,
  jalurDistribution,
  paymentStatusDistribution,
  dailyRegistrationTrend,
  quotaInfo,
} from "../lib/ppdbAnalytics";
import { buildWorkQueue, type WorkQueueGroup } from "../lib/ppdbQueue";
import type { NextAction } from "../components/ppdb/NextActionCard";
import { PageGuide } from "../components/guide/PageGuide";
import {
  RingkasanView,
  AntrianKerjaView,
  type BerandaKpi,
  type BerandaViz,
  type RenderLink,
} from "../components/ppdb/berandaPanel";

// --- Konstanta agregasi (STUB sampai backend wired) ---
// TODO(api): ganti dengan field `kuota` di doctype Gelombang PPDB.
const KUOTA_GELOMBANG_AKTIF_STUB = 200;
// TODO(api): ganti dengan field `tanggal_tutup` di doctype Gelombang PPDB.
const GELOMBANG_DEADLINE_ISO = "2026-06-30";
const TODAY_ISO = "2026-05-25";
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TREND_WINDOW_DAYS = 14;
const RIWAYAT_TUNGGAKAN_STUB = 3;

// Status pendaftaran yang dihitung sebagai "lolos" pada KPI.
const LOLOS_STATUSES = new Set(["Lulus", "Daftar Ulang", "Diterima"]);
// Status pembayaran yang menandakan tagihan belum tertangani.
const PAYMENT_PENDING = "Tertunda";

// Identitas dua view + label UI (no magic strings).
const VIEW_RINGKASAN = "ringkasan";
const VIEW_ANTRIAN = "antrian";
type BerandaView = typeof VIEW_RINGKASAN | typeof VIEW_ANTRIAN;
const VIEW_TABS: { id: BerandaView; label: string }[] = [
  { id: VIEW_RINGKASAN, label: "Ringkasan" },
  { id: VIEW_ANTRIAN, label: "Antrian Kerja" },
];
const GUIDE_STORAGE_ID = "ppdb-beranda";

// Field "Pendaftaran PPDB" terverifikasi dari doctype JSON.
type PendaftaranRow = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
};
const PENDAFTARAN_FIELDS = ["name", "status", "gelombang_ppdb", "calon_siswa", "tanggal_daftar"];

/** Hari tersisa menuju deadline (0 bila tanggal invalid atau sudah lewat). */
function hariTersisa(deadlineIso: string, todayIso: string): number {
  const d = new Date(deadlineIso).getTime();
  const t = new Date(todayIso).getTime();
  if (Number.isNaN(d) || Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((d - t) / MS_PER_DAY));
}

/** Hitung jumlah pendaftar unik dengan minimal satu tagihan tertunda. */
function countPembayaranPending(list: ReturnType<typeof listPpdbForSekolah>): number {
  return list.filter((p) => p.pembayaran.some((b) => b.status === PAYMENT_PENDING)).length;
}

/** Bangun KPI agregat dari baris backend + mock pembayaran. */
function useKpi(
  rows: PendaftaranRow[],
  ppdbMockList: ReturnType<typeof listPpdbForSekolah>,
): BerandaKpi {
  return useMemo(() => {
    const total = rows.length;
    const lolos = rows.filter((p) => p.status && LOLOS_STATUSES.has(p.status)).length;
    return {
      total,
      lolos,
      pembayaranPending: countPembayaranPending(ppdbMockList),
      hariTersisa: hariTersisa(GELOMBANG_DEADLINE_ISO, TODAY_ISO),
    };
  }, [rows, ppdbMockList]);
}

/** Rakit bundel data visualisasi dari analytics murni. */
function useViz(
  rows: PendaftaranRow[],
  ppdbMockList: ReturnType<typeof listPpdbForSekolah>,
): BerandaViz {
  return useMemo(() => {
    const trend = dailyRegistrationTrend(rows, TREND_WINDOW_DAYS, TODAY_ISO);
    const quota = quotaInfo(rows.length, KUOTA_GELOMBANG_AKTIF_STUB);
    return {
      funnel: funnelData(rows),
      trendPoints: trend.points,
      trendLabels: trend.labels,
      jalur: jalurDistribution(ppdbMockList),
      paymentDist: paymentStatusDistribution(ppdbMockList),
      quotaFilled: quota.filled,
      quotaTotal: KUOTA_GELOMBANG_AKTIF_STUB,
    };
  }, [rows, ppdbMockList]);
}

/**
 * Blok "Perlu Perhatian" — dipertahankan verbatim dari versi lama agar sinyal
 * lintas modul (pembayaran tertunda, riwayat tunggakan) tidak hilang.
 */
function useAttention(
  ppdbMockList: ReturnType<typeof listPpdbForSekolah>,
  pembayaranPending: number,
): AttentionItem[] {
  return useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (pembayaranPending > 0) {
      // Ambil pendaftar pertama dengan tunggakan untuk landing kontak.
      const firstPending = ppdbMockList.find((p) =>
        p.pembayaran.some((b) => b.status === PAYMENT_PENDING),
      );
      items.push({
        id: "pembayaran-tertunda",
        label: `${pembayaranPending} pendaftar belum bayar`,
        description: firstPending ? `Mulai dari ${firstPending.noPendaftaran}` : "Belum melunasi biaya PPDB",
        tone: "warning",
        badge: "Bayar",
        actionLabel: "Tinjau Pembayaran",
        actionHref: "/sch/$sekolah/akademik/ppdb/pembayaran",
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
        actionHref: "/sch/$sekolah/keuangan",
      });
    }
    return items;
  }, [ppdbMockList, pembayaranPending]);
}

/** Pilih aksi prioritas: grup non-kosong dengan count tertinggi → NextAction. */
function pickNextAction(groups: WorkQueueGroup[]): NextAction | null {
  const candidates = groups.filter((g) => g.count > 0);
  if (candidates.length === 0) return null;
  // Count tertinggi = beban kerja terbesar → diangkat ke depan mata staff.
  const top = candidates.reduce((best, g) => (g.count > best.count ? g : best));
  const tone = top.tone === "neutral" ? "brand" : top.tone;
  return {
    label: `${top.label} (${top.count})`,
    description: top.description,
    href: top.actionHref,
    tone,
  };
}

// Langkah panduan PageGuide — dipisah agar JSX header ringkas.
const GUIDE_STEPS = [
  { title: "Pilih view sesuai peran", detail: "Ringkasan untuk pantauan manajer, Antrian Kerja untuk eksekusi harian staff." },
  { title: "Baca Ringkasan", detail: "KPI, pipeline, tren, komposisi jalur, status pembayaran, dan pengisian kuota dalam satu layar." },
  { title: "Kerjakan Antrian", detail: "Tiap kartu menautkan langsung ke modul terkait; Langkah Berikutnya mengangkat beban kerja terbesar." },
];
const GUIDE_INTRO = "Beranda menyesuaikan diri dengan peran Anda, namun Anda bebas berpindah view kapan saja.";

/** Segmented toggle dua view; tombol aktif diberi latar brand. */
function ViewToggle({ view, onChange }: { view: BerandaView; onChange: (v: BerandaView) => void }): React.ReactNode {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1" role="group" aria-label="Pilih tampilan beranda">
      {VIEW_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={view === tab.id}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === tab.id ? "bg-brand text-white shadow-sm" : "text-muted-fg hover:text-fg",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Beranda PPDB role-adaptive. Diexport agar bisa diuji tanpa RouterProvider. */
export function PpdbBerandaPage(): React.ReactNode {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const role = usePpdbRole();

  // View awal mengikuti peran utama; state lokal agar pengguna bebas berpindah.
  const [view, setView] = useState<BerandaView>(
    role.primary === "manajer" ? VIEW_RINGKASAN : VIEW_ANTRIAN,
  );

  const pendaftaranQ = useResourceList<PendaftaranRow>("Pendaftaran PPDB", {
    fields: PENDAFTARAN_FIELDS,
    order_by: "`tanggal_daftar` desc",
    limit_page_length: 0,
  });
  const rows = pendaftaranQ.data ?? [];

  // Mock PPDB list, scoped ke active school slug.
  const ppdbMockList = useMemo(() => listPpdbForSekolah(sekolah), [sekolah]);

  const kpi = useKpi(rows, ppdbMockList);
  const viz = useViz(rows, ppdbMockList);
  const attention = useAttention(ppdbMockList, kpi.pembayaranPending);
  const queueGroups = useMemo(() => buildWorkQueue(ppdbMockList, TODAY_ISO), [ppdbMockList]);
  const nextAction = useMemo(() => pickNextAction(queueGroups), [queueGroups]);

  // renderLink disuntik ke panel agar bebas-router; param sekolah diisi di sini.
  const renderLink: RenderLink = (href, children) => (
    <Link to={href as "/sch/$sekolah/akademik/ppdb/pembayaran"} params={{ sekolah }}>
      {children}
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penerimaan"
        title="Beranda PPDB"
        description={
          <>
            Pusat kendali <GlossaryTooltip term="PPDB" definition={GLOSSARY.PPDB} /> untuk tahun
            ajaran berjalan.
          </>
        }
        actions={
          <Link to="/sch/$sekolah/akademik/ppdb/buat" params={{ sekolah }}>
            <Button>
              <span className="mr-1.5 h-4 w-4"><IconPlus /></span>
              Buat Pendaftaran
            </Button>
          </Link>
        }
      />

      <PageGuide storageId={GUIDE_STORAGE_ID} intro={GUIDE_INTRO} steps={GUIDE_STEPS} />

      <ViewToggle view={view} onChange={setView} />

      {view === VIEW_RINGKASAN ? (
        <RingkasanView kpi={kpi} viz={viz} attention={attention} renderLink={renderLink} />
      ) : (
        <AntrianKerjaView groups={queueGroups} nextAction={nextAction} renderLink={renderLink} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb/")({ component: PpdbBerandaPage });

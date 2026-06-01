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
import { buildWorkQueue, type WorkQueueGroup } from "../lib/ppdbQueue";
import type { NextAction } from "../components/ppdb/NextActionCard";
import { PageGuide } from "../components/guide/PageGuide";
import {
  RingkasanView,
  AntrianKerjaView,
  type RenderLink,
} from "../components/ppdb/berandaPanel";
import {
  useLiveAggregates,
  useKpi,
  useViz,
  PENDAFTARAN_FIELDS,
  TODAY_ISO,
  PAYMENT_PENDING,
  type PendaftaranRow,
} from "../components/ppdb/berandaLive";

// Jumlah calon dengan riwayat tunggakan di sekolah asal (sinyal lintas modul,
// belum punya endpoint live — tetap fallback statik).
const RIWAYAT_TUNGGAKAN_STUB = 3;

// Identitas dua view + label UI (no magic strings).
const VIEW_RINGKASAN = "ringkasan";
const VIEW_ANTRIAN = "antrian";
type BerandaView = typeof VIEW_RINGKASAN | typeof VIEW_ANTRIAN;
const VIEW_TABS: { id: BerandaView; label: string }[] = [
  { id: VIEW_RINGKASAN, label: "Ringkasan" },
  { id: VIEW_ANTRIAN, label: "Antrian Kerja" },
];
const GUIDE_STORAGE_ID = "ppdb-beranda";

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
        actionHref: "/sch/$sekolah/ppdb/pembayaran",
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

  // Sumber live (gelombang/statistik/pembayaran); tiap KPI/viz fallback sendiri.
  const live = useLiveAggregates();
  const kpi = useKpi(rows, ppdbMockList, live);
  const viz = useViz(rows, ppdbMockList, live);
  const attention = useAttention(ppdbMockList, kpi.pembayaranPending);
  const queueGroups = useMemo(() => buildWorkQueue(ppdbMockList, TODAY_ISO), [ppdbMockList]);
  const nextAction = useMemo(() => pickNextAction(queueGroups), [queueGroups]);

  // renderLink disuntik ke panel agar bebas-router; param sekolah diisi di sini.
  const renderLink: RenderLink = (href, children) => (
    <Link to={href as "/sch/$sekolah/ppdb/pembayaran"} params={{ sekolah }}>
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
          <Link to="/sch/$sekolah/ppdb/buat" params={{ sekolah }}>
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

export const Route = createFileRoute("/sch/$sekolah/ppdb/")({ component: PpdbBerandaPage });

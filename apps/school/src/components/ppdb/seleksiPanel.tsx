/**
 * SeleksiAnalyticsPanel — papan visual seleksi PPDB (khusus halaman Seleksi).
 *
 * Menyajikan tiga sudut pandang dari daftar pendaftar (mock, scoped per
 * sekolah): sebaran skor tes (histogram BarChart), proporsi lulus/gagal/belum
 * (DonutChart), dan papan peringkat terurut skor menurun dengan nomor rank.
 *
 * Murni presentational: menerima list pendaftar + sekolah lalu menghitung viz
 * secara deterministik (logika analitik tetap di lib/ppdbAnalytics). Komponen
 * ini hanya diimpor oleh route Seleksi PPDB.
 */

import { useMemo, type ReactNode } from "react";
import { Badge, DataTable, SectionCard, type Column } from "@sekolahpro/ui";
import { BarChart, DonutChart } from "../viz";
import type { ChartDatum } from "../viz/charts";
import { scoreHistogram } from "../../lib/ppdbAnalytics";
import type { Pendaftar } from "../../data/ppdb";

// Label viz — string UI Bahasa Indonesia terpusat (no magic strings).
const TITLE_HISTOGRAM = "Sebaran Skor Tes";
const DESC_HISTOGRAM = "Jumlah peserta per rentang nilai (0-100).";
const TITLE_DONUT = "Komposisi Hasil";
const TITLE_RANKING = "Peringkat Skor";
const DESC_RANKING = "Pelamar diurutkan dari skor tertinggi.";
const DONUT_CENTER_LABEL = "peserta";
const RANK_PREVIEW_LIMIT = 15;

// Tone donat hasil seleksi — token chart, bukan warna mentah.
const DONUT_TONE_LULUS = "emerald";
const DONUT_TONE_GAGAL = "rose";
const DONUT_TONE_BELUM = "neutral";

// Ambang lulus default papan skor (skor tes >= ini dianggap lulus).
const PASS_THRESHOLD = 70;

/** Satu baris papan peringkat: pendaftar + skor + nomor urut. */
interface RankRow {
  rank: number;
  noPendaftaran: string;
  namaLengkap: string;
  jalur: string;
  skorTes: number;
}

/**
 * Bangun papan peringkat: hanya pendaftar berskor terdefinisi, terurut skor
 * menurun, lalu diberi nomor rank 1..n. Tie diselesaikan stabil oleh sort.
 */
function buildRanking(list: Pendaftar[]): RankRow[] {
  return list
    .filter((p): p is Pendaftar & { skorTes: number } => p.skorTes !== undefined)
    .slice()
    .sort((a, b) => b.skorTes - a.skorTes)
    .map((p, index) => ({
      rank: index + 1,
      noPendaftaran: p.noPendaftaran,
      namaLengkap: p.namaLengkap,
      jalur: p.jalur,
      skorTes: p.skorTes,
    }));
}

/**
 * Hitung komposisi hasil (lulus/gagal/belum dinilai) sebagai data donat.
 * "Belum dinilai" = skor tes undefined; sisanya dibandingkan ke ambang lulus.
 */
function buildResultDonut(list: Pendaftar[]): ChartDatum[] {
  let lulus = 0;
  let gagal = 0;
  let belum = 0;
  for (const p of list) {
    if (p.skorTes === undefined) belum += 1;
    else if (p.skorTes >= PASS_THRESHOLD) lulus += 1;
    else gagal += 1;
  }
  // Hanya emit segmen non-kosong agar legenda donat tidak penuh nol.
  return [
    { label: "Lulus", value: lulus, tone: DONUT_TONE_LULUS },
    { label: "Belum Lulus", value: gagal, tone: DONUT_TONE_GAGAL },
    { label: "Belum Dinilai", value: belum, tone: DONUT_TONE_BELUM },
  ].filter((d) => d.value > 0) as ChartDatum[];
}

/** Kolom papan peringkat — rank, nama, jalur, skor (tabular). */
const RANK_COLUMNS: Column<RankRow>[] = [
  {
    key: "rank",
    header: "#",
    align: "right",
    width: "56px",
    cell: (r) => <span className="tabular-nums text-muted-fg">{r.rank}</span>,
  },
  {
    key: "namaLengkap",
    header: "Calon Siswa",
    cell: (r) => <span className="font-medium">{r.namaLengkap}</span>,
  },
  {
    key: "noPendaftaran",
    header: "No. Pendaftaran",
    cell: (r) => <span className="font-mono text-xs text-muted-fg">{r.noPendaftaran}</span>,
  },
  {
    key: "jalur",
    header: "Jalur",
    cell: (r) => <Badge tone="neutral">{r.jalur}</Badge>,
  },
  {
    key: "skorTes",
    header: "Skor",
    align: "right",
    width: "96px",
    cell: (r) => <span className="font-semibold tabular-nums">{r.skorTes}</span>,
  },
];

interface Props {
  /** Daftar pendaftar (mock) sudah ter-scope ke sekolah aktif. */
  list: Pendaftar[];
  /**
   * Histogram skor dari sumber LIVE (Hasil Tes Akademik PPDB). Bila diberikan,
   * menggantikan histogram mock; bila undefined, panel jatuh kembali ke
   * scoreHistogram(list). Pemutusan live-vs-mock dilakukan di route (tempat hook
   * live berada) agar komponen ini tetap murni presentational.
   */
  histogramOverride?: ChartDatum[] | undefined;
}

/**
 * Render panel analitik seleksi: histogram skor, donat hasil, dan papan
 * peringkat. Semua viz degrade mulus saat list kosong (chart kosong + tabel
 * dengan pesan empty).
 */
export function SeleksiAnalyticsPanel({ list, histogramOverride }: Props): ReactNode {
  // Prioritaskan histogram live; fallback ke mock saat override tak tersedia.
  const histogram = useMemo(
    () => histogramOverride ?? scoreHistogram(list),
    [histogramOverride, list],
  );
  const donutData = useMemo(() => buildResultDonut(list), [list]);
  const ranking = useMemo(() => buildRanking(list), [list]);
  const totalScored = ranking.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={TITLE_HISTOGRAM} description={DESC_HISTOGRAM} className="lg:col-span-2">
          <BarChart data={histogram} />
        </SectionCard>

        <SectionCard title={TITLE_DONUT}>
          <DonutChart
            data={donutData}
            centerTop={totalScored}
            centerBottom={DONUT_CENTER_LABEL}
          />
        </SectionCard>
      </div>

      <SectionCard title={TITLE_RANKING} description={DESC_RANKING} padded={false}>
        <DataTable
          data={ranking.slice(0, RANK_PREVIEW_LIMIT)}
          columns={RANK_COLUMNS}
          rowKey={(r) => r.noPendaftaran}
          empty="Belum ada peserta dengan skor tes."
        />
      </SectionCard>
    </div>
  );
}

// Re-export board config (kolom + mini stat) agar route Seleksi cukup
// mengimpor dari satu modul panel. Definisi nyata ada di ./seleksiBoard.
export {
  buildSeleksiColumns,
  SeleksiMiniStat,
  type SeleksiBoardRow,
  type SeleksiColumnHandlers,
} from "./seleksiBoard";

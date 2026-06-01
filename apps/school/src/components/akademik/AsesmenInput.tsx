/**
 * AsesmenInput.tsx — Halaman input nilai test per rombel (detail Asesmen).
 *
 * Memuat dokumen Asesmen, anggota rombel aktif, dan info siswa; menampilkan
 * grid nilai per-siswa dengan autosave saat keluar dari kolom (on-blur / Enter).
 * Redesign ini menambah PageGuide, ringkasan meta test (InfoGrid), serta
 * visualisasi progres pengisian dan distribusi nilai — TANPA mengubah perilaku
 * jaringan, nama doctype/field, mutasi, atau invalidasi cache.
 *
 * Role framing (label/penekanan saja, tidak pernah menyembunyikan fungsi):
 *  - Guru: pelaku utama input nilai (autosave on-blur).
 *  - Administrator Akademik: memastikan kelengkapan & konsistensi data.
 *  - Kepala Sekolah: memantau sebaran nilai & ketuntasan kelas.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Skeleton,
  StatCard,
  IconArrowLeft,
  IconCheck,
  IconChart,
  IconClock,
  IconEdit,
  IconUsers,
} from "@sekolahpro/ui";
import { getResource, listResource, updateResource } from "@sekolahpro/api-client";
import { DistributionBar, ProgressRing, type Tone } from "../viz";
import { PageGuide, type PageGuideStep } from "../guide";

export interface NilaiRow {
  siswa: string;
  nilai?: number | null;
  catatan?: string;
}

// Payload baris nilai yang dikirim ke server (nilai sudah pasti angka valid).
interface PayloadRow {
  siswa: string;
  nilai: number;
}

interface AsesmenDoc {
  name: string;
  judul: string;
  mata_pelajaran: string;
  komponen: string;
  rombel: string;
  semester: string;
  tahun_ajaran: string;
  nilai?: NilaiRow[];
}

export interface AnggotaRow {
  siswa: string;
  no_urut?: number;
}
export interface SiswaInfo {
  name: string;
  nama_lengkap?: string;
  nis?: string;
}

export type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface SiswaCell {
  siswa: string;
  nama: string;
  nis?: string;
  value: string;
  baseline: string;
  status: RowStatus;
  error?: string;
}

const ANGGOTA_FIELDS = ["name", "siswa", "no_urut", "status", "parent"];
const SISWA_FIELDS = ["name", "nama_lengkap", "nis"];

// Batas nilai valid.
const NILAI_MIN = 0;
const NILAI_MAX = 100;

// Ambang predikat untuk distribusi rentang nilai (batas bawah inklusif).
const GRADE_BANDS: { label: string; min: number; tone: Tone }[] = [
  { label: "85–100 (A)", min: 85, tone: "emerald" },
  { label: "70–84 (B)", min: 70, tone: "sky" },
  { label: "55–69 (C)", min: 55, tone: "amber" },
  { label: "0–54 (D)", min: 0, tone: "rose" },
];

/** Validasi input nilai mentah: kosong = boleh, selain itu harus angka 0–100. */
export function clampNilai(raw: string): { ok: boolean; error: string | null } {
  const t = raw.trim();
  if (t === "") return { ok: true, error: null };
  const n = Number(t);
  if (Number.isNaN(n)) return { ok: false, error: "Bukan angka" };
  if (n < NILAI_MIN || n > NILAI_MAX) return { ok: false, error: `${NILAI_MIN}–${NILAI_MAX}` };
  return { ok: true, error: null };
}

/** Guard rentang nilai valid untuk agregasi ringkasan. */
function inRange(n: number): boolean {
  return n >= NILAI_MIN && n <= NILAI_MAX;
}

/** Ambil daftar anggota rombel aktif terurut nomor urut. */
async function loadAnggota(rombel: string): Promise<AnggotaRow[]> {
  return listResource<AnggotaRow>("Anggota Rombel", {
    fields: ANGGOTA_FIELDS,
    filters: [
      ["parent", "=", rombel],
      ["status", "=", "Aktif"],
    ],
    order_by: "`no_urut` asc",
    limit_page_length: 200,
  });
}

/** Ambil info nama & NIS siswa untuk daftar nama yang diberikan. */
async function loadSiswa(names: string[]): Promise<Map<string, SiswaInfo>> {
  if (names.length === 0) return new Map();
  const rows = await listResource<SiswaInfo>("Siswa", {
    fields: SISWA_FIELDS,
    filters: [["name", "in", names.join(",")]],
    limit_page_length: names.length,
  });
  return new Map(rows.map((r) => [r.name, r]));
}

/** Susun baris sel siswa dari anggota + info siswa + nilai tersimpan. */
export function buildCells(
  anggota: AnggotaRow[],
  siswaMap: Map<string, SiswaInfo>,
  nilaiBySiswa: Map<string, NilaiRow>,
): SiswaCell[] {
  return anggota.map((a) => {
    const existing = nilaiBySiswa.get(a.siswa);
    const v = existing?.nilai != null ? String(existing.nilai) : "";
    const info = siswaMap.get(a.siswa);
    return {
      siswa: a.siswa,
      nama: info?.nama_lengkap ?? a.siswa,
      ...(info?.nis ? { nis: info.nis } : {}),
      value: v,
      baseline: v,
      status: "saved" as RowStatus,
    };
  });
}

/** Langkah panduan halaman, ditujukan terutama untuk Guru. */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Periksa info test di atas",
    detail: "Pastikan mata pelajaran, komponen, rombel, dan semester sudah benar sebelum mengisi.",
    roles: ["guru", "admin"],
  },
  {
    title: "Ketik nilai 0–100 pada kolom siswa",
    detail: "Gunakan angka saja. Nilai di luar 0–100 atau bukan angka akan ditandai merah.",
    roles: ["guru"],
  },
  {
    title: "Tersimpan otomatis saat keluar kolom",
    detail: "Tidak ada tombol Simpan. Begitu Anda pindah kolom (atau tekan Enter), nilai langsung disimpan.",
    roles: ["guru"],
  },
  {
    title: "Pantau progres & sebaran",
    detail: "Lihat lingkaran ketuntasan dan batang distribusi untuk melihat kemajuan kelas secara cepat.",
    roles: ["kepala", "admin"],
  },
];

const GUIDE_TIPS = [
  "Tekan Enter untuk menyimpan baris ini dan langsung pindah ke siswa berikutnya.",
  "Tanda centang hijau = tersimpan, 'menyimpan…' = sedang dikirim, badge merah = gagal/keliru.",
];

export function AsesmenInput({ asesmenId, sekolah }: { asesmenId: string; sekolah?: string }) {
  const qc = useQueryClient();
  const [doc, setDoc] = useState<AsesmenDoc | null>(null);
  const [cells, setCells] = useState<SiswaCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await getResource<AsesmenDoc>("Asesmen", asesmenId);
      setDoc(d);
      const anggota = await loadAnggota(d.rombel);
      const siswaMap = await loadSiswa(anggota.map((a) => a.siswa).filter(Boolean));
      const nilaiBySiswa = new Map<string, NilaiRow>(
        (d.nilai ?? []).map((r) => [r.siswa, r]),
      );
      setCells(buildCells(anggota, siswaMap, nilaiBySiswa));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat asesmen.");
    } finally {
      setLoading(false);
    }
  }, [asesmenId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setValue = useCallback((idx: number, value: string) => {
    setCells((prev) => {
      const next = [...prev];
      const c = next[idx];
      if (!c) return prev;
      const { error } = clampNilai(value);
      const isClean = value.trim() === c.baseline.trim() && !error;
      const updated: SiswaCell = {
        siswa: c.siswa,
        nama: c.nama,
        value,
        baseline: c.baseline,
        status: error ? "error" : isClean ? "saved" : "dirty",
        ...(c.nis ? { nis: c.nis } : {}),
        ...(error ? { error } : {}),
      };
      next[idx] = updated;
      return next;
    });
  }, []);

  // Autosave on-blur: kirim seluruh array nilai (Frappe ganti child rows).
  const saveCell = useCallback(
    async (idx: number) => {
      const target = cells[idx];
      if (!target || target.status !== "dirty") return;
      setCells((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], status: "saving" };
        return next;
      });
      const payloadNilai: PayloadRow[] = cells
        .map((c): PayloadRow | null => {
          const t = c.value.trim();
          if (t === "") return null;
          const n = Number(t);
          if (Number.isNaN(n) || n < NILAI_MIN || n > NILAI_MAX) return null;
          return { siswa: c.siswa, nilai: n };
        })
        .filter((r): r is PayloadRow => r !== null);
      try {
        await updateResource("Asesmen", asesmenId, { nilai: payloadNilai });
        setCells((prev) => {
          const next = [...prev];
          const c = next[idx];
          if (c) next[idx] = { ...c, baseline: c.value, status: "saved" };
          return next;
        });
        await qc.invalidateQueries({ queryKey: ["resource:list", "Asesmen"] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan";
        setCells((prev) => {
          const next = [...prev];
          const c = next[idx];
          if (c) next[idx] = { ...c, status: "error", error: msg };
          return next;
        });
      }
    },
    [cells, asesmenId, qc],
  );

  // Returns true when a row at `idx` exists and was focused; false signals the
  // caller it has reached the end of the list (used to give Enter feedback).
  const focusRow = useCallback((idx: number): boolean => {
    const el = inputRefs.current.get(idx);
    if (!el) return false;
    el.focus();
    el.select();
    return true;
  }, []);

  const summary = useMemo(() => deriveSummary(cells), [cells]);

  if (loading) return <AsesmenSkeleton />;

  if (loadError || !doc) {
    return (
      <div className="space-y-6">
        <Alert tone="danger" title="Gagal memuat asesmen">
          <div className="flex items-center justify-between gap-3">
            <span>{loadError ?? "Asesmen tidak ditemukan."}</span>
            <Button variant="outline" onClick={reload}>
              Coba lagi
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          {
            label: "Akademik",
            render: ({ className, children }) => (
              <Link to="/sch/$sekolah/akademik" params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          {
            label: "Input Nilai Test",
            render: ({ className, children }) => (
              <Link to="/sch/$sekolah/akademik/asesmen" params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          { label: doc.judul },
        ]}
      />

      <PageHeader
        eyebrow="Akademik · Input Nilai Test"
        title={doc.judul}
        description={`${doc.mata_pelajaran} · ${doc.komponen} · ${doc.semester} · ${doc.tahun_ajaran}`}
        actions={
          <Link
            to="/sch/$sekolah/akademik/asesmen"
            params={{ sekolah: sekolah ?? "" }}
            className="inline-flex items-center justify-center rounded-md border border-border h-10 px-4 text-sm font-medium hover:bg-muted"
          >
            <IconArrowLeft className="h-4 w-4 mr-1.5 shrink-0" />
            Kembali
          </Link>
        }
      />

      <PageGuide
        storageId="asesmen-detail"
        intro="Halaman ini untuk mengisi nilai test setiap siswa di rombel. Nilai tersimpan otomatis — tidak perlu menekan tombol Simpan."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <MetaSection doc={doc} totalSiswa={cells.length} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Terisi" value={`${summary.filled}/${summary.total}`} hint="siswa dinilai" icon={<IconEdit />} accent="brand" urgency={summary.empty > 0 ? "warn" : "normal"} />
        <StatCard label="Rata-rata" value={summary.avg != null ? summary.avg.toFixed(1) : "—"} hint="nilai kelas" icon={<IconChart />} accent="violet" urgency="normal" />
        <StatCard label="Tertinggi" value={summary.max != null ? String(summary.max) : "—"} hint="nilai puncak" icon={<IconCheck />} accent="emerald" urgency="normal" />
      </div>

      <ProgressSection summary={summary} grades={summary.gradeSegments} />

      <SectionCard
        title={`Daftar Nilai · ${cells.length} siswa`}
        description="Isi nilai 0–100 per siswa. Enter pindah ke bawah; tersimpan otomatis saat keluar dari kolom."
        padded={false}
      >
        {cells.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-fg">
            Rombel ini belum punya anggota aktif.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {cells.map((c, idx) => (
              <NilaiRowItem
                key={c.siswa}
                cell={c}
                idx={idx}
                onChange={setValue}
                onSave={saveCell}
                onEnter={focusRow}
                registerRef={(el) => {
                  if (el) inputRefs.current.set(idx, el);
                  else inputRefs.current.delete(idx);
                }}
              />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/** Ringkasan terhitung dari nilai saat ini (terisi, rata-rata, distribusi). */
interface AsesmenSummary {
  filled: number;
  empty: number;
  total: number;
  avg: number | null;
  max: number | null;
  gradeSegments: { label: string; value: number; tone: Tone }[];
}

/** Hitung ringkasan & segmen distribusi predikat dari sel saat ini. */
export function deriveSummary(cells: SiswaCell[]): AsesmenSummary {
  // Exclude empty (belum dinilai) cells BEFORE the numeric coercion: Number("")
  // is 0, not NaN, so an unscored student would otherwise be averaged in as a 0
  // and counted in the lowest grade band.
  const vals = cells
    .map((c) => c.value.trim())
    .filter((t) => t !== "")
    .map((t) => Number(t))
    .filter((n) => !Number.isNaN(n) && inRange(n));
  const filled = cells.filter((c) => c.value.trim() !== "").length;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const max = vals.length ? Math.max(...vals) : null;
  const gradeSegments = GRADE_BANDS.map((band) => ({
    label: band.label,
    tone: band.tone,
    value: vals.filter((n) => n >= band.min && bandUpper(n, band.min)).length,
  }));
  return { filled, empty: cells.length - filled, total: cells.length, avg, max, gradeSegments };
}

/** True jika n tergolong band yang dimulai pada `min` (band tertinggi yg cocok). */
function bandUpper(n: number, min: number): boolean {
  const higher = GRADE_BANDS.filter((b) => b.min > min).map((b) => b.min);
  const ceiling = higher.length ? Math.min(...higher) : NILAI_MAX + 1;
  return n < ceiling;
}

/** Kartu ringkasan meta test (judul, mapel, komponen, rombel, semester). */
function MetaSection({ doc, totalSiswa }: { doc: AsesmenDoc; totalSiswa: number }) {
  return (
    <SectionCard
      title="Info Test"
      description="Detail asesmen yang sedang dinilai."
      action={<Badge tone="brand">{doc.semester}</Badge>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="brand">{doc.mata_pelajaran}</Badge>
        <Badge tone="neutral">{doc.komponen}</Badge>
        <Badge tone="success">{doc.tahun_ajaran}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-fg">
          <IconUsers className="h-3.5 w-3.5 shrink-0" />
          {totalSiswa} siswa
        </span>
      </div>
      <InfoGrid cols={3}>
        <InfoField label="Judul Test" value={doc.judul} />
        <InfoField label="Mata Pelajaran" value={doc.mata_pelajaran} />
        <InfoField label="Komponen" value={doc.komponen} />
        <InfoField label="Rombel" value={doc.rombel} />
        <InfoField label="Semester" value={doc.semester} />
        <InfoField label="Tahun Ajaran" value={doc.tahun_ajaran} />
      </InfoGrid>
    </SectionCard>
  );
}

/** Visualisasi progres pengisian + distribusi terisi/kosong + predikat. */
function ProgressSection({
  summary,
  grades,
}: {
  summary: AsesmenSummary;
  grades: { label: string; value: number; tone: Tone }[];
}) {
  const pct = summary.total > 0 ? Math.round((summary.filled / summary.total) * 100) : 0;
  const fillTone: Tone = summary.empty === 0 ? "emerald" : pct >= 50 ? "brand" : "amber";
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title="Ketuntasan Pengisian" className="lg:col-span-1">
        <div className="flex flex-col items-center gap-3 py-2">
          <ProgressRing value={pct} tone={fillTone} label={`${summary.filled} dari ${summary.total} siswa terisi`} />
          <div className="flex items-center gap-1.5 text-xs text-muted-fg">
            <IconClock className="h-3.5 w-3.5 shrink-0" />
            {summary.empty > 0 ? `${summary.empty} siswa belum dinilai` : "Semua siswa sudah dinilai"}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Status Pengisian" className="lg:col-span-2">
        <DistributionBar
          segments={[
            { label: "Terisi", value: summary.filled, tone: "emerald" },
            { label: "Kosong", value: summary.empty, tone: "neutral" },
          ]}
        />
        <div className="mt-6">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
            Sebaran Predikat
          </div>
          {summary.filled === 0 ? (
            <p className="text-sm text-muted-fg">Belum ada nilai untuk dianalisis.</p>
          ) : (
            <DistributionBar segments={grades} />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/** Satu baris siswa pada grid nilai (status simpan + input ramah keyboard). */
function NilaiRowItem({
  cell,
  idx,
  onChange,
  onSave,
  onEnter,
  registerRef,
}: {
  cell: SiswaCell;
  idx: number;
  onChange: (idx: number, value: string) => void;
  onSave: (idx: number) => void;
  onEnter: (idx: number) => boolean;
  registerRef: (el: HTMLInputElement | null) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/40">
      <div className="min-w-0 flex items-center gap-3">
        <span className="text-xs text-muted-fg tabular-nums w-6 text-right">{idx + 1}</span>
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{cell.nama}</div>
          {cell.nis ? <div className="text-xs text-muted-fg font-mono">{cell.nis}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RowStatusIndicator status={cell.status} saved={cell.baseline.trim() !== ""} error={cell.error} />
        <input
          ref={registerRef}
          type="number"
          min={NILAI_MIN}
          max={NILAI_MAX}
          inputMode="numeric"
          aria-label={`Nilai untuk ${cell.nama}`}
          value={cell.value}
          onChange={(e) => onChange(idx, e.target.value)}
          onBlur={() => onSave(idx)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSave(idx);
              // Advance to the next student; if this was the last row, blur so
              // the user gets a clear "done" signal instead of a silent no-op.
              if (!onEnter(idx + 1)) e.currentTarget.blur();
            }
          }}
          className={`w-20 rounded-md border bg-bg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/40 ${
            cell.status === "error" ? "border-rose-400" : "border-border"
          }`}
        />
      </div>
    </li>
  );
}

/** Indikator status simpan untuk satu baris (menyimpan / tersimpan / error). */
function RowStatusIndicator({ status, saved, error }: { status: RowStatus; saved: boolean; error?: string | undefined }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-fg">
        <IconClock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        menyimpan…
      </span>
    );
  }
  if (status === "error") return <Badge tone="danger">{error ?? "error"}</Badge>;
  if (status === "dirty") return <span className="text-xs text-amber-600">belum tersimpan</span>;
  if (status === "saved" && saved) {
    return (
      <span className="text-emerald-600" title="Tersimpan">
        <IconCheck className="h-4 w-4 shrink-0 inline-block" />
      </span>
    );
  }
  return null;
}

/** Skeleton placeholder saat memuat data asesmen. */
function AsesmenSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * sch.$sekolah.akademik.$ta.ekskul.sesi.$id.tsx — Daftar hadir satu sesi.
 *
 * Layar absensi utama pembina. Roster diisi otomatis dari pendaftaran aktif;
 * SEMUA peserta default "Hadir" sehingga kasus umum butuh nol ketukan. Pembina
 * cukup mengubah status siswa yang Izin/Sakit/Alpha. Setiap perubahan memicu
 * AUTOSAVE seluruh array kehadiran (Frappe mengganti child rows), dengan mesin
 * status per-baris idle/dirty/saving/saved/error — meniru EntriNilaiGrid.
 *
 * topik & catatan bersifat sekunder dan disimpan terpisah di bawah roster.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  SectionCard,
  Textarea,
  cn,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconUsers,
} from "@sekolahpro/ui";
import { getResource, listResource, updateResource, useResourceList } from "@sekolahpro/api-client";
import { DistributionBar, ProgressRing } from "../components/viz";
import {
  kehadiranSegments,
  persentaseHadir,
  tallyKehadiran,
  type KehadiranStatus,
} from "../lib/ekskulRecap";

const SESI_DOCTYPE = "Sesi Ekstrakurikuler";
const ENROLL_DOCTYPE = "Pendaftaran Ekstrakurikuler";
const SISWA_DOCTYPE = "Siswa";
const ENROLL_FIELDS = ["siswa"];
const SISWA_FIELDS = ["name", "nama_lengkap"];

/** Daftar status kehadiran yang dapat dipilih (urut tampil = urut tombol). */
const STATUS_LIST: readonly KehadiranStatus[] = ["Hadir", "Izin", "Sakit", "Alpha"];
const DEFAULT_STATUS: KehadiranStatus = "Hadir";

type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/** Satu baris kehadiran siswa pada roster, dengan status simpan per-baris. */
interface AttendanceRowState {
  siswa: string;
  nama: string;
  status: KehadiranStatus;
  saveStatus: RowStatus;
  error?: string;
}

/** Baris kehadiran tersimpan pada dokumen sesi. */
interface KehadiranChild {
  siswa: string;
  status?: KehadiranStatus;
}

/** Dokumen sesi yang dimuat untuk header + kehadiran yang sudah ada. */
interface SesiDoc {
  name: string;
  ekstrakurikuler: string;
  tanggal?: string;
  pertemuan_ke?: number;
  topik?: string;
  catatan?: string;
  semester?: string;
  tahun_ajaran?: string;
  kehadiran?: KehadiranChild[];
}

interface EnrollRow {
  siswa: string;
}
interface SiswaRow {
  name: string;
  nama_lengkap?: string;
}

/** Petakan kehadiran tersimpan menjadi lookup status per-siswa. */
function indexKehadiran(rows: KehadiranChild[] | undefined): Map<string, KehadiranStatus> {
  const map = new Map<string, KehadiranStatus>();
  for (const r of rows ?? []) {
    if (r.siswa && r.status) map.set(r.siswa, r.status);
  }
  return map;
}

/** Susun baris roster: status dari kehadiran tersimpan atau default Hadir. */
function buildRows(
  enrolled: EnrollRow[],
  namaBySiswa: Map<string, string>,
  saved: Map<string, KehadiranStatus>,
): AttendanceRowState[] {
  return enrolled
    .filter((e) => !!e.siswa)
    .map((e) => ({
      siswa: e.siswa,
      nama: namaBySiswa.get(e.siswa) ?? e.siswa,
      status: saved.get(e.siswa) ?? DEFAULT_STATUS,
      saveStatus: "saved" as RowStatus,
    }));
}

/** Payload kehadiran (seluruh baris) yang dikirim ke server saat autosave. */
function toPayload(rows: AttendanceRowState[]): KehadiranChild[] {
  return rows.map((r) => ({ siswa: r.siswa, status: r.status }));
}

/** Muat info nama lengkap siswa untuk daftar nama yang diberikan. */
async function loadSiswaNames(names: string[]): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();
  const rows = await listResource<SiswaRow>(SISWA_DOCTYPE, {
    fields: SISWA_FIELDS,
    filters: [["name", "in", names.join(",")]],
    limit_page_length: names.length,
  });
  return new Map(rows.map((r) => [r.name, r.nama_lengkap ?? r.name]));
}

/** Hitung jumlah peserta dengan status Hadir untuk ProgressRing. */
function countHadir(rows: AttendanceRowState[]): number {
  return rows.filter((r) => r.status === "Hadir").length;
}

/** Tombol segmented 4-arah untuk memilih status kehadiran satu baris. */
function StatusToggle({
  value,
  onPick,
  disabled,
}: {
  value: KehadiranStatus;
  onPick: (s: KehadiranStatus) => void;
  disabled: boolean;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border" role="group">
      {STATUS_LIST.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className={cn(
            "px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            value === s ? STATUS_ACTIVE_CLASS[s] : "bg-bg text-muted-fg hover:bg-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** Warna tombol aktif per status (hijau Hadir … merah Alpha). */
const STATUS_ACTIVE_CLASS: Record<KehadiranStatus, string> = {
  Hadir: "bg-emerald-500 text-white",
  Izin: "bg-sky-500 text-white",
  Sakit: "bg-amber-500 text-white",
  Alpha: "bg-rose-500 text-white",
};

/** Indikator status simpan satu baris (menyimpan / tersimpan / gagal). */
function RowSaveBadge({ status, error }: { status: RowStatus; error?: string | undefined }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-fg">
        <IconClock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        menyimpan…
      </span>
    );
  }
  if (status === "error") return <Badge tone="danger">{error ?? "gagal"}</Badge>;
  if (status === "saved") {
    return (
      <span className="text-emerald-600" title="Tersimpan">
        <IconCheck className="h-4 w-4 shrink-0 inline-block" />
      </span>
    );
  }
  return null;
}

/** Satu baris siswa: nama + nomor + segmented control + status simpan. */
function AttendanceRow({
  row,
  idx,
  onPick,
}: {
  row: AttendanceRowState;
  idx: number;
  onPick: (siswa: string, status: KehadiranStatus) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-6 text-right text-xs tabular-nums text-muted-fg">{idx + 1}</span>
        <span className="truncate font-medium text-fg">{row.nama}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RowSaveBadge status={row.saveStatus} error={row.error} />
        <StatusToggle
          value={row.status}
          onPick={(s) => onPick(row.siswa, s)}
          disabled={row.saveStatus === "saving"}
        />
      </div>
    </li>
  );
}

/** Header sesi: nama program + tanggal + pertemuan ke-N. */
function SesiHeader({ doc, sekolah, ta }: { doc: SesiDoc; sekolah: string; ta: string }) {
  return (
    <PageHeader
      eyebrow="Ekstrakurikuler · Daftar Hadir"
      title={doc.ekstrakurikuler}
      description={`${doc.tanggal ?? "—"} · Pertemuan ke-${doc.pertemuan_ke ?? "?"}`}
      actions={
        <Link
          to="/sch/$sekolah/akademik/$ta/ekskul/sesi"
          params={{ sekolah, ta }}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          <IconArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />
          Kembali
        </Link>
      }
    />
  );
}

/** Ringkasan kehadiran: ProgressRing %hadir + DistributionBar per status. */
function KehadiranSummary({ rows }: { rows: AttendanceRowState[] }) {
  const tally = useMemo(() => tallyKehadiran(rows), [rows]);
  const total = rows.length;
  const hadir = useMemo(() => countHadir(rows), [rows]);
  const persen = persentaseHadir(hadir, total);
  return (
    <SectionCard title="Ringkasan kehadiran" description="Terhitung langsung dari status di bawah.">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing value={persen} tone={persen >= 100 ? "emerald" : "brand"} label="Hadir" />
          <span className="text-xs tabular-nums text-muted-fg">
            {hadir} / {total} peserta
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            <IconUsers className="h-4 w-4 shrink-0 text-muted-fg" />
            Sebaran status
          </div>
          <DistributionBar segments={kehadiranSegments(tally)} />
        </div>
      </div>
    </SectionCard>
  );
}

/** Kartu catatan sesi sekunder: topik + catatan, disimpan eksplisit. */
function CatatanSesi({
  topik,
  catatan,
  busy,
  onChangeTopik,
  onChangeCatatan,
  onSave,
  saved,
}: {
  topik: string;
  catatan: string;
  busy: boolean;
  onChangeTopik: (v: string) => void;
  onChangeCatatan: (v: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <SectionCard
      title="Topik & catatan"
      description="Opsional — ringkasan materi atau catatan pertemuan."
    >
      <div className="space-y-3">
        <Input value={topik} onChange={(e) => onChangeTopik(e.target.value)} placeholder="Topik pertemuan…" />
        <Textarea value={catatan} onChange={(e) => onChangeCatatan(e.target.value)} placeholder="Catatan…" />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSave} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan catatan"}
          </Button>
          {saved ? <span className="text-xs text-emerald-600">Tersimpan.</span> : null}
        </div>
      </div>
    </SectionCard>
  );
}

/** Muat dokumen sesi sekali saat id berubah; sediakan reload manual. */
function useSesiDoc(id: string) {
  const [doc, setDoc] = useState<SesiDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoc(await getResource<SesiDoc>(SESI_DOCTYPE, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { doc, loading, error, reload };
}

function SesiDetail() {
  // `routeTa` is the workspace TA segment from the URL (for intra-module Links);
  // the doc's own `tahun_ajaran` below (`ta`) scopes the roster query.
  const { sekolah, ta: routeTa, id } = useParams({ from: "/sch/$sekolah/akademik/$ta/ekskul/sesi/$id" });
  const { doc, loading, error, reload } = useSesiDoc(id);

  const [rows, setRows] = useState<AttendanceRowState[]>([]);
  const [rosterReady, setRosterReady] = useState(false);
  const [topik, setTopik] = useState("");
  const [catatan, setCatatan] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  const program = doc?.ekstrakurikuler ?? "";
  const ta = doc?.tahun_ajaran ?? "";

  // Roster aktif: pendaftaran berstatus Aktif pada program + TA sesi.
  const enrollQ = useResourceList<EnrollRow>(
    ENROLL_DOCTYPE,
    {
      fields: ENROLL_FIELDS,
      filters: [
        ["ekstrakurikuler", "=", program],
        ["tahun_ajaran", "=", ta],
        ["status", "=", "Aktif"],
      ] as [string, string, string][],
      limit_page_length: 0,
    },
    { enabled: !!program && !!ta },
  );

  // Susun roster + status awal saat sesi & pendaftaran siap.
  useEffect(() => {
    if (!doc || !enrollQ.data) return;
    setTopik(doc.topik ?? "");
    setCatatan(doc.catatan ?? "");
    const saved = indexKehadiran(doc.kehadiran);
    const enrolled = enrollQ.data;
    let cancelled = false;
    void loadSiswaNames(enrolled.map((e) => e.siswa)).then((namaMap) => {
      if (cancelled) return;
      setRows(buildRows(enrolled, namaMap, saved));
      setRosterReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [doc, enrollQ.data]);

  // Autosave: set baris dirty→saving, kirim seluruh array, lalu saved/error.
  const pickStatus = useCallback(
    async (siswa: string, status: KehadiranStatus) => {
      let nextRows: AttendanceRowState[] = [];
      setRows((prev) => {
        nextRows = prev.map((r) =>
          r.siswa === siswa ? { ...r, status, saveStatus: "saving" as RowStatus } : r,
        );
        return nextRows;
      });
      try {
        await updateResource(SESI_DOCTYPE, id, { kehadiran: toPayload(nextRows) });
        setRows((prev) =>
          prev.map((r) => (r.siswa === siswa ? { ...r, saveStatus: "saved" } : r)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan";
        setRows((prev) =>
          prev.map((r) => (r.siswa === siswa ? { ...r, saveStatus: "error", error: msg } : r)),
        );
      }
    },
    [id],
  );

  // Simpan eksplisit untuk field sekunder (topik + catatan).
  const saveMeta = useCallback(async () => {
    setSavingMeta(true);
    setMetaSaved(false);
    try {
      await updateResource(SESI_DOCTYPE, id, { topik, catatan });
      setMetaSaved(true);
    } catch {
      setMetaSaved(false);
    } finally {
      setSavingMeta(false);
    }
  }, [id, topik, catatan]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-fg">Memuat sesi…</div>;
  }
  if (error || !doc) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error ?? "Sesi tidak ditemukan."}
        <Button variant="outline" className="ml-3" onClick={reload}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const savingAny = rows.some((r) => r.saveStatus === "saving");

  return (
    <div className="space-y-6">
      <SesiHeader doc={doc} sekolah={sekolah} ta={routeTa} />

      <div className="flex items-center gap-2 text-xs">
        {savingAny ? (
          <Badge tone="neutral" dot>
            Menyimpan…
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Tersimpan
          </Badge>
        )}
        <span className="text-muted-fg">Default semua Hadir — tandai yang tidak hadir saja.</span>
      </div>

      {rows.length > 0 ? <KehadiranSummary rows={rows} /> : null}

      <SectionCard
        title={`Daftar hadir · ${rows.length} peserta`}
        description="Ketuk status untuk mengubah; tersimpan otomatis."
        padded={false}
      >
        {!rosterReady ? (
          <div className="px-4 py-10 text-center text-sm text-muted-fg">Memuat peserta…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-fg">
            Belum ada peserta aktif pada ekstrakurikuler ini.{" "}
            <Link
              to="/sch/$sekolah/akademik/$ta/ekskul/pendaftaran"
              params={{ sekolah, ta: routeTa }}
              className="text-brand hover:underline"
            >
              Daftarkan peserta dulu
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, idx) => (
              <AttendanceRow key={row.siswa} row={row} idx={idx} onPick={pickStatus} />
            ))}
          </ul>
        )}
      </SectionCard>

      <CatatanSesi
        topik={topik}
        catatan={catatan}
        busy={savingMeta}
        onChangeTopik={(v) => {
          setTopik(v);
          setMetaSaved(false);
        }}
        onChangeCatatan={(v) => {
          setCatatan(v);
          setMetaSaved(false);
        }}
        onSave={saveMeta}
        saved={metaSaved}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul/sesi/$id")({
  component: SesiDetail,
});

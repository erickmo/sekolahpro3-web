/**
 * Ekstrakurikuler · Pendaftaran (enrol peserta ke program).
 *
 * Alur Koordinator: pilih program → lihat meter kuota langsung → tambah siswa.
 * Meter kuota di sini hanya GERBANG TAMPILAN (display gate): ia menonaktifkan
 * kontrol tambah saat penuh agar UX jelas, tetapi backend tetap gerbang yang
 * sebenarnya — server boleh menolak (kuota penuh / duplikat / TA tertutup) walau
 * meter klien tampak masih lega. Semua kegagalan create ditampilkan menonjol.
 *
 * Pola dipinjam dari sch.$sekolah.akademik.asesmen.index.tsx (loadOptions
 * SearchableSelect, error state, refetch) dan AkademikContextBar (async picker).
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useParams, createFileRoute } from "@tanstack/react-router";
import {
  listResource,
  useResourceList,
  createResource,
  updateResource,
} from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  PageHeader,
  SectionCard,
  Badge,
  Select,
  SearchableSelect,
  cn,
  IconUsers,
  type SearchableOption,
} from "@sekolahpro/ui";
import { ProgressRing } from "../components/viz/charts";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulContext } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";

/** Doctype names — dipakai berulang, jadi diberi konstanta agar tak jadi magic string. */
const DT_PROGRAM = "Ekstrakurikuler";
const DT_PENDAFTARAN = "Pendaftaran Ekstrakurikuler";
const DT_SISWA = "Siswa";

/** Status pendaftaran sesuai backend doctype. */
const STATUS_AKTIF = "Aktif";
const ENROLL_STATUSES = [
  "Aktif",
  "Mengundurkan Diri",
  "Lulus",
  "Dikeluarkan",
] as const;
type EnrollStatus = (typeof ENROLL_STATUSES)[number];

/** Batas atas persentase ring + skala persen. */
const PERCENT_FULL = 100;
/** Jumlah maksimum opsi yang ditarik tiap pencarian picker. */
const PICKER_PAGE = 40;

/** Baris pendaftaran aktif yang ditarik dari backend. */
interface EnrollRow {
  name: string;
  siswa: string;
  status: string;
}

/** Dokumen program terpilih — hanya field yang dipakai meter. */
interface ProgramDoc {
  name: string;
  nama?: string;
  kuota?: number;
}

/** Baris Siswa untuk resolusi nama lengkap dari link value. */
interface SiswaRow {
  name: string;
  nama_lengkap?: string;
}

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih program",
    detail: "Cari ekstrakurikuler pada tahun ajaran berjalan yang ingin diisi pesertanya.",
    roles: ["koordinator"],
  },
  {
    title: "Tambah siswa",
    detail: "Cari nama siswa lalu tambahkan. Status awal otomatis Aktif.",
    roles: ["koordinator"],
  },
  {
    title: "Kuota dijaga otomatis",
    detail: "Meter menampilkan sisa kuota; server tetap menolak bila benar-benar penuh.",
    roles: ["koordinator"],
  },
];

/**
 * Hitung jumlah pendaftaran aktif dari daftar baris (guard array kosong).
 */
function countActive(rows: EnrollRow[]): number {
  return rows.length;
}

/**
 * Persentase keterisian kuota untuk ProgressRing. Kuota 0 = tanpa batas → 0%.
 * Hasil di-clamp ke [0, 100] agar ring tetap valid saat melebihi kuota.
 */
function kuotaPercent(active: number, kuota: number): number {
  if (kuota <= 0) return 0;
  return Math.min(PERCENT_FULL, Math.round((active / kuota) * PERCENT_FULL));
}

/**
 * Bangun peta nis→nama_lengkap dari hasil fetch Siswa agar baris pendaftaran
 * bisa menampilkan nama yang ramah, bukan sekadar link value (nis).
 */
function buildNameMap(rows: SiswaRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.nama_lengkap) map[r.name] = r.nama_lengkap;
  }
  return map;
}

interface KuotaMeterProps {
  programNama: string;
  active: number;
  kuota: number;
  loading: boolean;
}

/**
 * Meter kuota: ProgressRing + teks "N / kuota" (atau tanpa batas). Menampilkan
 * Badge merah "Kuota penuh" saat kuota>0 dan terisi penuh. Hanya tampilan —
 * penonaktifan kontrol tambah ditangani komponen induk.
 */
function KuotaMeter({ programNama, active, kuota, loading }: KuotaMeterProps): ReactNode {
  const unlimited = kuota <= 0;
  const penuh = !unlimited && active >= kuota;
  const ringValue = kuotaPercent(active, kuota);
  const teks = loading
    ? "Memuat…"
    : unlimited
      ? `${active} peserta · tanpa batas`
      : `${active} / ${kuota}`;
  return (
    <div className="flex items-center gap-5">
      <ProgressRing value={ringValue} tone={penuh ? "rose" : "brand"} label="Keterisian" />
      <div className="space-y-1.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
          {programNama || "Program"}
        </div>
        <div className="text-lg font-semibold tabular-nums text-fg">{teks}</div>
        {penuh ? (
          <Badge tone="danger" dot>
            Kuota penuh
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Masih tersedia
          </Badge>
        )}
      </div>
    </div>
  );
}

interface EnrollRowItemProps {
  row: EnrollRow;
  namaLengkap: string;
  busy: boolean;
  onStatusChange: (name: string, status: EnrollStatus) => void;
}

/**
 * Satu baris peserta aktif: nama lengkap + Select untuk mengubah status.
 * Perubahan status disalurkan ke induk (yang memanggil updateResource + refetch).
 */
function EnrollRowItem({ row, namaLengkap, busy, onStatusChange }: EnrollRowItemProps): ReactNode {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <IconUsers className="h-4 w-4 shrink-0" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-fg">{namaLengkap}</div>
          <div className="text-xs text-muted-fg">{row.siswa}</div>
        </div>
      </div>
      <Select
        className="w-44"
        value={row.status}
        disabled={busy}
        onChange={(e) => onStatusChange(row.name, e.target.value as EnrollStatus)}
      >
        {ENROLL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </li>
  );
}

/** Tarik opsi program untuk picker, difilter pada tahun ajaran aktif. */
function useLoadPrograms(tahunAjaran: string) {
  return useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const filters: Array<[string, string, string]> = [["tahun_ajaran", "=", tahunAjaran]];
      if (q) filters.push(["nama", "like", `%${q}%`]);
      const rows = await listResource<{ name: string; nama?: string }>(DT_PROGRAM, {
        fields: ["name", "nama"],
        filters,
        order_by: "`nama` asc",
        limit_page_length: PICKER_PAGE,
      });
      return rows.map((r) => ({ value: r.name, label: r.nama ?? r.name }));
    },
    [tahunAjaran],
  );
}

/** Tarik opsi siswa untuk picker, difilter pada sekolah aktif bila tersedia. */
function useLoadSiswa(sekolah: string) {
  return useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const filters: Array<[string, string, string]> = [];
      if (sekolah) filters.push(["sekolah", "=", sekolah]);
      if (q) filters.push(["nama_lengkap", "like", `%${q}%`]);
      const rows = await listResource<SiswaRow>(DT_SISWA, {
        fields: ["name", "nama_lengkap"],
        filters,
        order_by: "`nama_lengkap` asc",
        limit_page_length: PICKER_PAGE,
      });
      return rows.map((r) => {
        const opt: SearchableOption = { value: r.name, label: r.nama_lengkap ?? r.name };
        opt.hint = r.name;
        return opt;
      });
    },
    [sekolah],
  );
}

/**
 * Hook yang membungkus fetch pendaftaran aktif + nama siswa untuk satu program.
 * Mengembalikan baris, peta nama, jumlah aktif, status loading, dan refetch.
 */
function useEnrollments(program: string) {
  const enrollFilters: Array<[string, string, string]> = [
    ["ekstrakurikuler", "=", program],
    ["status", "=", STATUS_AKTIF],
  ];
  const enrollQ = useResourceList<EnrollRow>(
    DT_PENDAFTARAN,
    { fields: ["name", "siswa", "status"], filters: enrollFilters, limit_page_length: 0 },
    { enabled: !!program },
  );
  const rows = useMemo(() => enrollQ.data ?? [], [enrollQ.data]);
  const siswaNames = useMemo(() => rows.map((r) => r.siswa), [rows]);

  const siswaQ = useResourceList<SiswaRow>(
    DT_SISWA,
    { fields: ["name", "nama_lengkap"], filters: [["name", "in", siswaNames.join(",")]] },
    { enabled: siswaNames.length > 0 },
  );
  const nameMap = useMemo(() => buildNameMap(siswaQ.data ?? []), [siswaQ.data]);

  return { rows, nameMap, active: countActive(rows), loading: enrollQ.isLoading, refetch: enrollQ.refetch };
}

function PendaftaranPage(): ReactNode {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const ctx = useEkskulContext();
  const { primary } = useEkskulRole();
  const session = useSession();
  const activeSekolah = session.activeSekolah?.name ?? sekolah;

  const [program, setProgram] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = useLoadPrograms(ctx.tahunAjaran);
  const loadSiswa = useLoadSiswa(activeSekolah);

  // Dokumen program terpilih → baca kuota & nama untuk meter.
  const programQ = useResourceList<ProgramDoc>(
    DT_PROGRAM,
    { fields: ["name", "nama", "kuota"], filters: [["name", "=", program]] },
    { enabled: !!program },
  );
  const programDoc = programQ.data?.[0];
  const kuota = programDoc?.kuota ?? 0;
  const programNama = programDoc?.nama ?? "";

  const { rows, nameMap, active, loading, refetch } = useEnrollments(program);
  const penuh = kuota > 0 && active >= kuota;

  /** Ubah status satu pendaftaran lalu segarkan daftar. */
  const handleStatusChange = useCallback(
    async (name: string, status: EnrollStatus) => {
      setError(null);
      try {
        await updateResource(DT_PENDAFTARAN, name, { status });
        refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memperbarui status peserta.");
      }
    },
    [refetch],
  );

  /** Tambah peserta baru ke program; server tetap gerbang kuota/duplikat. */
  const handleAdd = useCallback(
    async (siswa: string) => {
      if (!siswa || !program) return;
      setError(null);
      setAdding(true);
      try {
        await createResource(DT_PENDAFTARAN, {
          siswa,
          ekstrakurikuler: program,
          status: STATUS_AKTIF,
        });
        refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menambahkan peserta.");
      } finally {
        setAdding(false);
      }
    },
    [program, refetch],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler · Pendaftaran"
        title="Pendaftaran Peserta"
        description="Pilih program lalu tambahkan siswa. Kuota dijaga otomatis oleh sistem."
      />

      <PageGuide
        storageId="ekskul-pendaftaran"
        title="Cara mendaftarkan peserta"
        intro="Sebagai Koordinator: pilih program → tambah siswa → kuota dijaga otomatis."
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <SectionCard
        title="1. Pilih Program"
        description="Cari ekstrakurikuler pada tahun ajaran berjalan."
        action={<Badge tone="brand">{ROLE_LABEL[primary]}</Badge>}
      >
        <SearchableSelect
          id="ekskul-program"
          value={program}
          onChange={setProgram}
          loadOptions={loadPrograms}
          placeholder="Cari program…"
          className="w-full sm:w-96"
        />
        {!ctx.tahunAjaran ? (
          <p className="mt-2 text-xs text-amber-700">
            Tahun ajaran belum dipilih — pilih TA pada bar konteks di atas.
          </p>
        ) : null}
      </SectionCard>

      {program ? (
        <>
          <SectionCard title="2. Kuota" description="Meter tampilan; server tetap penjaga sebenarnya.">
            <KuotaMeter
              programNama={programNama}
              active={active}
              kuota={kuota}
              loading={loading || programQ.isLoading}
            />
          </SectionCard>

          <SectionCard
            title="3. Tambah Peserta"
            description={penuh ? "Kuota penuh — tambah dinonaktifkan." : "Cari nama siswa untuk ditambahkan."}
          >
            <div className={cn("flex flex-col gap-2 sm:max-w-md", penuh && "opacity-60")}>
              <SearchableSelect
                id="ekskul-siswa"
                value=""
                onChange={handleAdd}
                loadOptions={loadSiswa}
                placeholder={adding ? "Menambahkan…" : "Cari siswa…"}
                className="w-full"
                {...(penuh || adding ? { disabled: true } : {})}
              />
              {penuh ? (
                <Badge tone="danger" dot>
                  Kuota penuh — peserta baru tidak dapat ditambahkan.
                </Badge>
              ) : null}
            </div>
            {error ? (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Peserta Aktif"
            description="Ubah status untuk menandai mengundurkan diri, lulus, atau dikeluarkan."
          >
            {loading ? (
              <div className="text-sm text-muted-fg">Memuat…</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                <IconUsers className="h-7 w-7 text-muted-fg" />
                <div className="text-sm font-medium text-fg">Belum ada peserta</div>
                <p className="max-w-xs text-xs text-muted-fg">
                  Tambahkan siswa pertama pada langkah di atas untuk mengisi program ini.
                </p>
              </div>
            ) : (
              <ul className="-my-2 divide-y divide-border">
                {rows.map((row) => (
                  <EnrollRowItem
                    key={row.name}
                    row={row}
                    namaLengkap={nameMap[row.siswa] ?? row.siswa}
                    busy={adding}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Pilih program dulu" description="Meter kuota & daftar peserta tampil setelah program dipilih.">
          <p className="text-sm text-muted-fg">
            Gunakan kolom pencarian di atas untuk memilih ekstrakurikuler.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul/pendaftaran/")({
  component: PendaftaranPage,
});

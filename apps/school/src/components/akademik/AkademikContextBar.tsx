// AkademikContextBar — sticky periode selector (Tahun Ajaran + Semester) untuk
// halaman operasional Akademik. Redesign: tambah label peran pengguna aktif,
// indikator status periode (berjalan / lampau / belum aktif), dan kejelasan
// visual selector. Semua logika periode (guarded switch, dirty confirm,
// setTahunAjaran/setSemester, banner) DIPERTAHANKAN tanpa perubahan perilaku.
import { useCallback } from "react";
import {
  Badge,
  SearchableSelect,
  SetupBanner,
  IconUsers,
  IconClock,
  IconCheck,
  cn,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";
import { useAkademikContext } from "../../lib/akademikContext";
import { useAkademikRole, ROLE_LABEL } from "../../lib/akademikRole";

const SEMESTER_OPTIONS: SearchableOption[] = [
  { value: "Ganjil", label: "Ganjil" },
  { value: "Genap", label: "Genap" },
];

const TA_FIELDS = ["name", "nama", "is_current", "status"];
const TA_PAGE = 50;
const SWITCH_CONFIRM = "Pindah periode? Perubahan yang belum disimpan akan hilang.";

type TahunAjaranRow = { name: string; nama?: string; is_current?: 0 | 1; status?: string };

/** Status periode terpilih → menentukan warna & label indikator di bar. */
type PeriodeStatus = "aktif" | "lampau" | "belum-aktif";

/** Subset BadgeTone bawaan komponen Badge yang dipakai bar ini. */
type BarBadgeTone = "success" | "warning" | "neutral";

/** Tentukan status periode dari flag konteks (tanpa memanggil data baru). */
function resolvePeriodeStatus(noActiveTa: boolean, isPastPeriod: boolean): PeriodeStatus {
  if (noActiveTa) return "belum-aktif";
  if (isPastPeriod) return "lampau";
  return "aktif";
}

/**
 * Tone Badge per status periode. Memakai BadgeTone bawaan komponen Badge
 * ("success"/"warning"/"neutral"), bukan palet Tone viz.
 */
const STATUS_TONE: Record<PeriodeStatus, BarBadgeTone> = {
  aktif: "success",
  lampau: "warning",
  "belum-aktif": "neutral",
};

const STATUS_LABEL: Record<PeriodeStatus, string> = {
  aktif: "Periode berjalan",
  lampau: "Periode lampau",
  "belum-aktif": "Belum ada TA aktif",
};

/** Badge kecil penanda status periode aktif di sebelah selector. */
function PeriodeStatusBadge({ status }: { status: PeriodeStatus }) {
  const Icon = status === "aktif" ? IconCheck : IconClock;
  return (
    <Badge tone={STATUS_TONE[status]} className="gap-1">
      <Icon className="h-3 w-3" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Badge peran pengguna aktif — hanya untuk framing, tidak membatasi fitur. */
function RoleBadge() {
  const { primary } = useAkademikRole();
  return (
    <Badge tone="brand" className="gap-1">
      <IconUsers className="h-3 w-3" aria-hidden />
      {ROLE_LABEL[primary]}
    </Badge>
  );
}

export function AkademikContextBar() {
  const { tahunAjaran, semester, setTahunAjaran, setSemester, isPastPeriod, noActiveTa, dirty } =
    useAkademikContext();

  const loadTA = useCallback(async (q: string): Promise<SearchableOption[]> => {
    const filters: Array<[string, string, string]> = q ? [["nama", "like", `%${q}%`]] : [];
    const rows = await listResource<TahunAjaranRow>("Tahun Ajaran", {
      fields: TA_FIELDS, filters, order_by: "`nama` desc", limit_page_length: TA_PAGE,
    });
    return rows.map((r): SearchableOption => {
      const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
      const tags: string[] = [];
      if (r.is_current) tags.push("Berjalan");
      if (r.status && r.status !== "Aktif") tags.push(r.status);
      if (tags.length > 0) opt.hint = tags.join(" · ");
      return opt;
    });
  }, []);

  // Konfirmasi sebelum ganti periode bila ada edit belum tersimpan.
  const guarded = useCallback(
    (fn: (v: string) => void) => (v: string) => {
      if (dirty && !globalThis.confirm(SWITCH_CONFIRM)) return;
      fn(v);
    },
    [dirty],
  );

  const periodeStatus = resolvePeriodeStatus(noActiveTa, isPastPeriod);
  const readOnlyHint = periodeStatus !== "aktif";

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-4 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Konteks Akademik
          </span>
          <PeriodeStatusBadge status={periodeStatus} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <label className="text-xs text-muted-fg shrink-0" htmlFor="akademik-ta">Tahun Ajaran</label>
          <SearchableSelect
            id="akademik-ta"
            value={tahunAjaran}
            onChange={guarded(setTahunAjaran)}
            loadOptions={loadTA}
            placeholder="Pilih TA…"
            className={cn("w-48", readOnlyHint && "ring-1 ring-amber-300/60 rounded-md")}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-fg shrink-0" htmlFor="akademik-semester">Semester</label>
          <SearchableSelect
            id="akademik-semester"
            value={semester}
            onChange={guarded(setSemester)}
            options={SEMESTER_OPTIONS}
            placeholder="Pilih semester…"
            className="w-36"
          />
        </div>

        {/* Peran pengguna aktif — didorong ke kanan agar terbaca sebagai konteks "siapa". */}
        <div className="ml-auto flex items-center gap-2">
          <RoleBadge />
        </div>
      </div>

      {(isPastPeriod || noActiveTa) && (
        <div className="px-4 sm:px-6 lg:px-8 pb-2.5">
          {noActiveTa ? (
            <SetupBanner
              tone="info"
              title="Belum ada Tahun Ajaran aktif"
              description="Atur Tahun Ajaran aktif di Master Data agar periode terpilih otomatis."
            />
          ) : (
            <SetupBanner
              tone="warning"
              title="Anda mengedit periode lampau/ditutup"
              description="Tahun Ajaran ini sudah ditutup atau di luar rentang tanggalnya. Pastikan periode benar sebelum input."
            />
          )}
        </div>
      )}
    </div>
  );
}

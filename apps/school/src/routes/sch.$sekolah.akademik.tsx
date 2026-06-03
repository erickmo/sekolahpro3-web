import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { AkademikContextProvider } from "../lib/akademikContext";
import { AkademikContextBar } from "../components/akademik/AkademikContextBar";
import { type NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { SectionCard } from "@sekolahpro/ui";
import {
  resolveTahunAjaran,
  computeSemester,
  isPastPeriod,
  readStoredPeriode,
  writeStoredPeriode,
  type TahunAjaranRow,
} from "../lib/akademikPeriode";

export interface AkademikSearch {
  ta?: string;
  semester?: string;
}

const TA_FIELDS = [
  "name", "nama", "is_current", "status",
  "tanggal_mulai", "tanggal_selesai",
  "semester_ganjil_mulai", "semester_ganjil_akhir",
  "semester_genap_mulai", "semester_genap_akhir",
];

// Grouped sub-navigation for the Akademik ModuleShell (operational pages only).
// Akademik = operasional saja. Setup (Tahun Ajaran, Kurikulum, Mapel, KKM,
// Komponen Nilai, Konfigurasi) pindah ke modul Master Data.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/akademik", label: "Dashboard", exact: true }],
  },
  {
    label: "Penilaian",
    items: [
      { to: "/sch/$sekolah/akademik/asesmen", label: "Input Nilai Test" },
      { to: "/sch/$sekolah/akademik/entri-nilai", label: "Entri Nilai" },
      { to: "/sch/$sekolah/akademik/raport", label: "Raport" },
    ],
  },
];

// Editor grid (entri-nilai/edit) mengelola periode lewat selector-nya sendiri
// (param rombel/mapel/ta/semester di rute itu, plus tombol "Ubah Konteks").
// Bar periode layout disembunyikan & efek redirect/persist dilewati di sana agar
// tidak mengeluarkan user dari editor atau menjadikan periode edit sementara
// "lengket" di localStorage.
const PERIODE_SELF_MANAGED = "/akademik/entri-nilai/edit";

export function isPeriodeSelfManaged(pathname: string): boolean {
  return pathname.includes(PERIODE_SELF_MANAGED);
}

// Bar konteks periode (Tahun Ajaran + Semester) tampil di SETIAP halaman Akademik,
// selaras dengan modul Ekstrakurikuler — termasuk Dashboard, yang KPI-nya disaring
// per periode. Hanya editor grid yang dikecualikan (mengelola periodenya sendiri).
// Guard "/akademik" menjaga fungsi tetap akurat bila dipanggil dengan path lain.
export function showContextBar(pathname: string): boolean {
  if (!pathname.includes("/akademik")) return false;
  return !isPeriodeSelfManaged(pathname);
}

// Halaman operasional yang menyaring data per periode. Hanya di sini layout
// menyisipkan panduan periode + ringkasan "Sebaran Tahun Ajaran" di atas Outlet;
// Dashboard punya panduan & visualisasinya sendiri, jadi tidak ditumpuk.
const PERIODE_INTRO_PREFIXES = [
  "/akademik/asesmen",
  "/akademik/entri-nilai",
  "/akademik/raport",
];

export function showPeriodeIntro(pathname: string): boolean {
  if (isPeriodeSelfManaged(pathname)) return false;
  return PERIODE_INTRO_PREFIXES.some((p) => pathname.includes(p));
}

// Panduan singkat fitur Konteks Periode — muncul bersama context bar di halaman
// operasional. Per-langkah diberi badge peran agar 3 alur (admin/guru/kepala)
// jelas tanpa menyembunyikan fitur apa pun.
const CONTEXT_GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pastikan Tahun Ajaran & Semester benar",
    detail: "Semua data nilai disaring per periode. Cek bar Konteks di atas sebelum input.",
    roles: ["admin", "guru", "kepala"],
  },
  {
    title: "Ganti periode lewat selector",
    detail: "Pilih Tahun Ajaran lalu Semester. Bila ada perubahan belum tersimpan, sistem minta konfirmasi.",
    roles: ["admin", "guru"],
  },
  {
    title: "Perhatikan penanda periode",
    detail: "Badge hijau = periode berjalan, kuning = periode lampau/ditutup. Periode lampau tetap bisa dilihat untuk audit.",
    roles: ["kepala", "admin"],
  },
];

const CONTEXT_GUIDE_TIPS = [
  "Periode terakhir yang Anda pilih disimpan otomatis dan dipakai lagi saat membuka modul ini.",
  "Tahun Ajaran aktif diatur di Master Data, bukan di sini.",
];

// Subset field TA yang dibutuhkan untuk ringkasan distribusi (struktural agar
// tidak bergantung pada bentuk persis TahunAjaranRow dari lib periode).
type TaStatusRow = { is_current?: number; status?: string };

/**
 * Ringkas daftar Tahun Ajaran menjadi segmen distribusi (Berjalan / Aktif /
 * Ditutup) untuk DistributionBar. Hanya memakai data taList yang sudah ada.
 */
function buildTaSegments(taList: TaStatusRow[]): DistributionSegment[] {
  let berjalan = 0;
  let aktif = 0;
  let ditutup = 0;
  for (const t of taList) {
    if (t.is_current) berjalan += 1;
    else if (t.status && t.status !== "Aktif") ditutup += 1;
    else aktif += 1;
  }
  return [
    { label: "Berjalan", value: berjalan, tone: "emerald" },
    { label: "Aktif", value: aktif, tone: "sky" },
    { label: "Ditutup/Lampau", value: ditutup, tone: "amber" },
  ];
}

// Layout shell for the Akademik module: ModuleShell (sticky sub-nav on every page,
// mirroring ekstrakurikuler) + period context bar on every page except the grid
// editor, wrapping the route Outlet.
function AkademikLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const search = useSearch({ from: "/sch/$sekolah/akademik" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik" });
  const [dirty, setDirty] = useState(false);

  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);

  // Acuan tanggal stabil per mount (hindari re-resolusi tiap render).
  const refDate = useRef(new Date()).current;

  // Resolusi periode dari URL → localStorage → data TA.
  const resolved = useMemo(() => {
    if (taList.length === 0) return null;
    const stored = readStoredPeriode(sekolah);
    const { ta, noActiveTa } = resolveTahunAjaran(taList, {
      refDate,
      ...(search.ta ? { urlTa: search.ta } : {}),
      ...(stored.ta ? { storedTa: stored.ta } : {}),
    });
    const taRow = taList.find((t) => t.name === ta);
    const semester = computeSemester(taRow, {
      refDate,
      ...(search.semester ? { urlSemester: search.semester } : {}),
      ...(stored.semester ? { storedSemester: stored.semester } : {}),
    });
    return { ta, semester, taRow, noActiveTa: !!noActiveTa };
  }, [taList, search.ta, search.semester, sekolah, refDate]);

  // Redirect (replace) ke URL ter-resolve bila param belum lengkap → satu sumber
  // kebenaran. Dilewati di editor (periode dikelola rute /edit sendiri).
  useEffect(() => {
    if (isPeriodeSelfManaged(pathname)) return;
    if (!resolved || !resolved.ta) return;
    if (search.ta === resolved.ta && search.semester === resolved.semester) return;
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, ta: resolved.ta, semester: resolved.semester }),
      replace: true,
    });
  }, [resolved, search.ta, search.semester, navigate, pathname]);

  // Sinkron pilihan aktif ke localStorage — kecuali di editor, agar periode edit
  // sementara tak menimpa default (stored ranking di atas is_current).
  useEffect(() => {
    if (isPeriodeSelfManaged(pathname)) return;
    if (search.ta && search.semester) {
      writeStoredPeriode(sekolah, { ta: search.ta, semester: search.semester });
    }
  }, [sekolah, search.ta, search.semester, pathname]);

  const setTahunAjaran = useCallback(
    (v: string) => navigate({ to: ".", search: (prev) => ({ ...prev, ta: v }), replace: true }),
    [navigate],
  );
  const setSemester = useCallback(
    (v: string) => navigate({ to: ".", search: (prev) => ({ ...prev, semester: v }), replace: true }),
    [navigate],
  );

  const tahunAjaran = search.ta ?? resolved?.ta ?? "";
  const semester = search.semester ?? resolved?.semester ?? "";
  const past = isPastPeriod(resolved?.taRow, refDate);

  // Bar konteks tampil di semua halaman kecuali editor grid; panduan + ringkasan
  // periode hanya disisipkan di halaman operasional (Dashboard punya sendiri).
  const showBar = showContextBar(pathname);
  const showIntro = showPeriodeIntro(pathname);

  // Ringkasan distribusi Tahun Ajaran — visualisasi dari data taList yang sudah
  // diambil layout (tanpa panggilan backend tambahan).
  const taSegments = useMemo(() => buildTaSegments(taList), [taList]);

  return (
    <AkademikContextProvider
      value={{
        tahunAjaran,
        semester,
        setTahunAjaran,
        setSemester,
        isPastPeriod: past,
        noActiveTa: resolved?.noActiveTa ?? false,
        dirty,
        setDirty,
      }}
    >
      <ModuleShell
        navGroups={NAV_GROUPS}
        pathname={pathname}
        {...(showBar ? { context: <AkademikContextBar /> } : {})}
      >
        {showIntro ? (
          <>
            <PageGuide
              storageId="layout-contextbar"
              title="Cara pakai Konteks Periode"
              intro="Bar di atas menentukan Tahun Ajaran & Semester untuk seluruh data nilai di modul Akademik."
              steps={CONTEXT_GUIDE_STEPS}
              tips={CONTEXT_GUIDE_TIPS}
            />
            <SectionCard
              title="Sebaran Tahun Ajaran"
              description="Status semua Tahun Ajaran yang tersedia untuk dipilih di Konteks."
            >
              {taList.length > 0 ? (
                <DistributionBar segments={taSegments} />
              ) : (
                <p className="text-sm text-muted-fg">
                  Belum ada Tahun Ajaran. Tambahkan di Master Data agar periode bisa dipilih.
                </p>
              )}
            </SectionCard>
          </>
        ) : null}
        <Outlet />
      </ModuleShell>
    </AkademikContextProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik")({
  component: AkademikLayout,
  validateSearch: (search: Record<string, unknown>): AkademikSearch => {
    const out: AkademikSearch = {};
    if (typeof search.ta === "string" && search.ta) out.ta = search.ta;
    if (typeof search.semester === "string" && search.semester) out.semester = search.semester;
    return out;
  },
});

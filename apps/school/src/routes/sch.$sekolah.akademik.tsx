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
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";
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

// Konteks (Tahun Ajaran + Semester) hanya relevan di halaman operasional yang
// menyaring data per periode. Setup tidak butuh, jadi bar disembunyikan di sana.
const CONTEXT_BAR_PREFIXES = [
  "/akademik/asesmen",
  "/akademik/entri-nilai",
  "/akademik/raport",
];

function showContextBar(pathname: string): boolean {
  return CONTEXT_BAR_PREFIXES.some((p) => pathname.includes(p));
}

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

  // Redirect (replace) ke URL ter-resolve bila param belum lengkap → satu sumber kebenaran.
  useEffect(() => {
    if (!resolved || !resolved.ta) return;
    if (search.ta === resolved.ta && search.semester === resolved.semester) return;
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, ta: resolved.ta, semester: resolved.semester }),
      replace: true,
    });
  }, [resolved, search.ta, search.semester, navigate]);

  // Sinkron pilihan aktif ke localStorage.
  useEffect(() => {
    if (search.ta && search.semester) {
      writeStoredPeriode(sekolah, { ta: search.ta, semester: search.semester });
    }
  }, [sekolah, search.ta, search.semester]);

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
      <div className="space-y-4">
        {showContextBar(pathname) ? <AkademikContextBar /> : null}
        <GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} variant="inline" />
        <Outlet />
      </div>
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

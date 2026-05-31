import { useCallback } from "react";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { AkademikContextProvider } from "../lib/akademikContext";
import { AkademikContextBar } from "../components/akademik/AkademikContextBar";
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";

export interface AkademikSearch {
  ta?: string;
  semester?: string;
}

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
  const search = useSearch({ from: "/sch/$sekolah/akademik" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik" });

  const setTahunAjaran = useCallback(
    (v: string) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, ta: v }),
        replace: true,
      });
    },
    [navigate],
  );
  const setSemester = useCallback(
    (v: string) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, semester: v }),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <AkademikContextProvider
      value={{
        tahunAjaran: search.ta ?? "",
        semester: search.semester ?? "",
        setTahunAjaran,
        setSemester,
      }}
    >
      <div className="space-y-4">
        {showContextBar(pathname) ? <AkademikContextBar /> : null}
        <GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} />
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

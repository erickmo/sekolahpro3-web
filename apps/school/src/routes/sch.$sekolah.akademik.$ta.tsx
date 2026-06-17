import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { Breadcrumb, SectionCard } from "@sekolahpro/ui";
import { AkademikContextProvider } from "../lib/akademikContext";
import { AkademikContextBar } from "../components/akademik/AkademikContextBar";
import { ModuleShell } from "../components/shell/ModuleShell";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { DistributionBar } from "../components/viz";
import {
  computeSemester,
  isPastPeriod,
  readStoredPeriode,
  writeStoredPeriode,
  type TahunAjaranRow,
} from "../lib/akademikPeriode";
import {
  buildTaSegments,
  buildWorkspaceNavGroups,
  isPeriodeSelfManaged,
  isSubmodulePath,
  showContextBar,
  showPeriodeIntro,
  workspaceSubLabel,
} from "../lib/akademikNav";

/** Search params for the per-TA workspace. The Tahun Ajaran itself lives in the
 * path (`$ta`); only the semester is a query param (it switches often within a TA). */
export interface AkademikWorkspaceSearch {
  semester?: string;
}

const TA_FIELDS = [
  "name", "nama", "is_current", "status",
  "tanggal_mulai", "tanggal_selesai",
  "semester_ganjil_mulai", "semester_ganjil_akhir",
  "semester_genap_mulai", "semester_genap_akhir",
];

// Grouped sub-navigation for the workspace ModuleShell. Every `to` carries the
// `$ta` segment; TanStack inherits the active `ta` param (as it does `$sekolah`),
// so the pill bar stays on the same Tahun Ajaran while switching feature pages.
// Setup (Tahun Ajaran, Kurikulum, Mapel, KKM, Komponen Nilai) tetap di Master Data;
// kelas/jadwal/ekskul kini hidup di workspace ini (Fase 1 single-door).
const NAV_GROUPS = buildWorkspaceNavGroups();

// Panduan singkat fitur Konteks Periode — muncul bersama context bar di halaman
// operasional. Per-langkah diberi badge peran agar 3 alur (admin/guru/kepala)
// jelas tanpa menyembunyikan fitur apa pun.
const CONTEXT_GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Tahun Ajaran ditentukan dari menu Akademik",
    detail: "Anda berada di ruang kerja satu Tahun Ajaran. Untuk pindah TA, klik 'Akademik' di breadcrumb dan pilih TA lain.",
    roles: ["admin", "guru", "kepala"],
  },
  {
    title: "Pastikan Semester benar",
    detail: "Data nilai disaring per semester. Ganti lewat selector di bar Konteks; bila ada perubahan belum tersimpan, sistem minta konfirmasi.",
    roles: ["admin", "guru"],
  },
  {
    title: "Perhatikan penanda periode",
    detail: "Badge hijau = periode berjalan, kuning = periode lampau/ditutup. TA arsip tetap bisa dibuka untuk audit & cetak ulang.",
    roles: ["kepala", "admin"],
  },
];

const CONTEXT_GUIDE_TIPS = [
  "Tahun Ajaran terakhir yang Anda buka disimpan otomatis dan dibuka lagi saat masuk modul Akademik.",
  "Tahun Ajaran aktif diatur di Master Data, bukan di sini.",
];

/**
 * Workspace layout for one Tahun Ajaran: resolves the TA from the `$ta` path
 * param, provides the period context (semester still chosen via the bar), and
 * wraps the feature pages in the shared ModuleShell + a breadcrumb back to the
 * TA hub. An unknown `$ta` redirects to the hub.
 */
function AkademikWorkspaceLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const submodule = isSubmodulePath(pathname);
  const { sekolah, ta } = useParams({ from: "/sch/$sekolah/akademik/$ta" });
  const search = useSearch({ from: "/sch/$sekolah/akademik/$ta" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik/$ta" });
  const [dirty, setDirty] = useState(false);

  // `useParams()` returns the SINGLE-decoded value — the router encodes the path
  // segment once, so links MUST pass the RAW TA `name` to `params={{ ta }}`
  // (never taPath/encodeURIComponent — that double-encodes and a name with "/"
  // or spaces then never matches a row → bounce to the picker). No manual
  // decode here: that would double-decode and throw on a literal "%".
  const decodedTa = ta;

  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);

  // Stable reference date per mount (avoid re-resolving every render).
  const refDate = useRef(new Date()).current;

  // Resolve the TA row from the `$ta` param. Primary match is exact (links now
  // pass the raw name). Defense-in-depth: also match a once-more-decoded form so
  // a stray double-encoded URL (old bookmark, or a stored value corrupted by the
  // pre-fix taPath double-encoding) self-heals instead of bouncing to the picker.
  const taRow = useMemo(() => {
    const exact = taList.find((t) => t.name === decodedTa);
    if (exact) return exact;
    let once = decodedTa;
    try {
      once = decodeURIComponent(decodedTa);
    } catch {
      // malformed "%" — leave as-is
    }
    return once !== decodedTa ? taList.find((t) => t.name === once) : undefined;
  }, [taList, decodedTa]);

  // Unknown $ta (not in the list once loaded) → back to the hub picker.
  useEffect(() => {
    if (isPeriodeSelfManaged(pathname)) return;
    if (taList.length === 0) return; // still loading or genuinely empty
    if (taRow) return;
    navigate({ to: "/sch/$sekolah/akademik", params: { sekolah }, search: { pick: 1 }, replace: true });
  }, [taList.length, taRow, navigate, sekolah, pathname]);

  // Semester resolution: URL → localStorage → TA date ranges. The TA itself is
  // fixed by the path, so only the semester needs resolving here.
  const semester = useMemo(() => {
    const stored = readStoredPeriode(sekolah);
    return computeSemester(taRow, {
      refDate,
      ...(search.semester ? { urlSemester: search.semester } : {}),
      ...(stored.semester ? { storedSemester: stored.semester } : {}),
    });
  }, [taRow, search.semester, sekolah, refDate]);

  // Normalise the URL so the resolved semester is always explicit (one source of
  // truth). Skipped in the grid editor, which manages its own period.
  useEffect(() => {
    // Sub-modules don't use the Ganjil/Genap semester axis — kelas has none, ekskul/jadwal use Semester docnames.
    if (submodule) return;
    if (isPeriodeSelfManaged(pathname)) return;
    if (!semester || search.semester === semester) return;
    navigate({ to: ".", search: (prev) => ({ ...prev, semester }), replace: true });
  }, [semester, search.semester, navigate, pathname, submodule]);

  // Persist the active {ta, semester} — drives the hub's auto-redirect into the
  // last-opened TA. Skipped in the editor so a temporary edit period never sticks.
  useEffect(() => {
    if (isPeriodeSelfManaged(pathname)) return;
    if (decodedTa && semester) writeStoredPeriode(sekolah, { ta: decodedTa, semester });
  }, [sekolah, decodedTa, semester, pathname]);

  // Switching TA navigates to the new TA's workspace root (period bar no longer
  // carries a TA dropdown; switching happens via the hub/breadcrumb).
  const setTahunAjaran = useCallback(
    // Pass the RAW name — the router encodes the segment once (taPath would
    // double-encode; see decodedTa note above).
    (v: string) =>
      navigate({ to: "/sch/$sekolah/akademik/$ta", params: { sekolah, ta: v }, replace: true }),
    [navigate, sekolah],
  );
  const setSemester = useCallback(
    (v: string) => navigate({ to: ".", search: (prev) => ({ ...prev, semester: v }), replace: true }),
    [navigate],
  );

  const past = isPastPeriod(taRow, refDate);
  const showBar = showContextBar(pathname);
  const showIntro = showPeriodeIntro(pathname);
  const taSegments = useMemo(() => buildTaSegments(taList), [taList]);
  const taLabel = taRow?.nama ?? decodedTa;
  const subLabel = workspaceSubLabel(pathname);

  // Sub-modules (kelas/jadwal/ekskul) bring their own ModuleShell chrome;
  // rendering ours would create a shell-in-shell double header.
  const chrome = submodule ? (
    <Outlet />
  ) : (
    <ModuleShell
      navGroups={NAV_GROUPS}
      pathname={pathname}
      {...(showBar ? { context: <AkademikContextBar taLabel={taLabel} /> } : {})}
    >
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              label: "Akademik",
              render: ({ className, children }) => (
                <Link
                  to="/sch/$sekolah/akademik"
                  params={{ sekolah }}
                  search={{ pick: 1 }}
                  className={className}
                >
                  {children}
                </Link>
              ),
            },
            { label: taLabel },
            { label: subLabel },
          ]}
        />
      </div>
      {showIntro ? (
        <>
          <PageGuide
            storageId="layout-contextbar"
            title="Cara pakai Konteks Periode"
            intro="Anda di ruang kerja satu Tahun Ajaran. Bar di atas menentukan Semester untuk seluruh data nilai; ganti Tahun Ajaran lewat menu Akademik."
            steps={CONTEXT_GUIDE_STEPS}
            tips={CONTEXT_GUIDE_TIPS}
          />
          <SectionCard
            title="Sebaran Tahun Ajaran"
            description="Status semua Tahun Ajaran yang tersedia. Pindah TA lewat menu Akademik."
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
  );

  return (
    <AkademikContextProvider
      value={{
        tahunAjaran: decodedTa,
        semester,
        setTahunAjaran,
        setSemester,
        isPastPeriod: past,
        // In a workspace a TA is always selected, so the "no active TA" banner
        // never applies here (it belongs to the hub's empty state).
        noActiveTa: false,
        dirty,
        setDirty,
      }}
    >
      {chrome}
    </AkademikContextProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta")({
  component: AkademikWorkspaceLayout,
  validateSearch: (search: Record<string, unknown>): AkademikWorkspaceSearch => {
    const out: AkademikWorkspaceSearch = {};
    if (typeof search.semester === "string" && search.semester) out.semester = search.semester;
    return out;
  },
});

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFileRoute,
  Outlet,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { Badge, SearchableSelect } from "@sekolahpro/ui";
import { EkskulContextProvider } from "../lib/ekskulContext";
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";
import {
  resolveTahunAjaran,
  isPastPeriod,
  type TahunAjaranRow,
} from "../lib/akademikPeriode";

interface SemesterRow {
  name: string;
  nama?: string;
  tahun_ajaran?: string;
}

const TA_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];
const SEMESTER_FIELDS = ["name", "nama", "tahun_ajaran"];

const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/ekstrakurikuler", label: "Dashboard", exact: true }],
  },
  {
    label: "Kegiatan",
    items: [
      { to: "/sch/$sekolah/ekstrakurikuler/sesi", label: "Sesi & Kehadiran" },
      { to: "/sch/$sekolah/ekstrakurikuler/raport", label: "Raport" },
    ],
  },
  {
    label: "Kelola",
    items: [
      { to: "/sch/$sekolah/ekstrakurikuler/program", label: "Program" },
      { to: "/sch/$sekolah/ekstrakurikuler/pendaftaran", label: "Pendaftaran" },
      { to: "/sch/$sekolah/ekstrakurikuler/mitra", label: "Mitra" },
    ],
  },
];

interface StoredPeriode {
  ta?: string;
  semester?: string;
}

function storageKey(sekolah: string): string {
  return `ekskul:periode:${sekolah}`;
}

function readEkskulPeriode(sekolah: string): StoredPeriode {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(sekolah));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPeriode;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeEkskulPeriode(sekolah: string, value: StoredPeriode): void {
  try {
    globalThis.localStorage?.setItem(storageKey(sekolah), JSON.stringify(value));
  } catch {
    /* ignore quota/unavailable */
  }
}

function EkskulLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useEkskulRole();
  const refDate = useRef(new Date()).current;

  const [taSel, setTaSel] = useState("");
  const [semSel, setSemSel] = useState("");
  const [dirty, setDirty] = useState(false);

  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);

  const resolvedTa = useMemo(() => {
    if (taSel) return taSel;
    if (taList.length === 0) return "";
    const stored = readEkskulPeriode(sekolah).ta;
    const { ta } = resolveTahunAjaran(taList, {
      refDate,
      ...(stored ? { storedTa: stored } : {}),
    });
    return ta;
  }, [taSel, taList, sekolah, refDate]);

  const semQ = useResourceList<SemesterRow>(
    "Semester",
    {
      fields: SEMESTER_FIELDS,
      filters: resolvedTa ? [["tahun_ajaran", "=", resolvedTa]] : [],
      order_by: "`name` asc",
      limit_page_length: 0,
    },
    { enabled: !!resolvedTa },
  );
  const semList = useMemo(() => semQ.data ?? [], [semQ.data]);

  const resolvedSem = useMemo(() => {
    if (semSel && semList.some((s) => s.name === semSel)) return semSel;
    const stored = readEkskulPeriode(sekolah).semester;
    if (stored && semList.some((s) => s.name === stored)) return stored;
    return semList[0]?.name ?? "";
  }, [semSel, semList, sekolah]);

  useEffect(() => {
    if (resolvedTa && resolvedSem) {
      writeEkskulPeriode(sekolah, { ta: resolvedTa, semester: resolvedSem });
    }
  }, [sekolah, resolvedTa, resolvedSem]);

  const setTahunAjaran = useCallback((v: string) => {
    setTaSel(v);
    setSemSel("");
  }, []);
  const setSemester = useCallback((v: string) => setSemSel(v), []);

  const taRow = taList.find((t) => t.name === resolvedTa);
  const past = isPastPeriod(taRow, refDate);
  const noActiveTa = taList.length > 0 && !taList.some((t) => t.is_current === 1);

  const taOptions = taList.map((t) => ({
    value: t.name,
    label: t.nama ?? t.name,
    ...(t.is_current ? { hint: "Berjalan" } : {}),
  }));
  const semOptions = semList.map((s) => ({ value: s.name, label: s.nama ?? s.name }));

  return (
    <EkskulContextProvider
      value={{
        tahunAjaran: resolvedTa,
        semester: resolvedSem,
        setTahunAjaran,
        setSemester,
        isPastPeriod: past,
        noActiveTa,
        dirty,
        setDirty,
      }}
    >
      <div className="space-y-4">
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-1 border-b border-border bg-bg/95 backdrop-blur px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg shrink-0">
            Konteks Ekstrakurikuler
          </span>
          {past ? (
            <Badge tone="warning" dot>
              Periode lampau
            </Badge>
          ) : (
            <Badge tone="success" dot>
              Periode berjalan
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-fg shrink-0" htmlFor="ek-ta">
              Tahun Ajaran
            </label>
            <SearchableSelect
              id="ek-ta"
              value={resolvedTa}
              onChange={setTahunAjaran}
              options={taOptions}
              placeholder="Pilih TA…"
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-fg shrink-0" htmlFor="ek-sem">
              Semester
            </label>
            <SearchableSelect
              id="ek-sem"
              value={resolvedSem}
              onChange={setSemester}
              options={semOptions}
              placeholder="Pilih semester…"
              className="w-44"
            />
          </div>
          <span className="ml-auto">
            <Badge tone="brand">{ROLE_LABEL[primary]}</Badge>
          </span>
        </div>
        <GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} variant="inline" />
        <Outlet />
      </div>
    </EkskulContextProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler")({
  component: EkskulLayout,
});

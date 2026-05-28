import { useCallback } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";
import { AkademikContextProvider } from "../lib/akademikContext";
import { AkademikContextBar } from "../components/akademik/AkademikContextBar";

interface AkademikSearch {
  ta?: string;
  semester?: string;
}

const NAV_GROUPS: { label: string; items: { to: string; label: string; exact?: boolean }[] }[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/$sekolah/akademik", label: "Dashboard", exact: true }],
  },
  {
    label: "Master",
    items: [
      { to: "/$sekolah/akademik/kurikulum", label: "Kurikulum" },
      { to: "/$sekolah/akademik/daftar", label: "Mata Pelajaran" },
      { to: "/$sekolah/akademik/komponen-nilai", label: "Komponen Nilai" },
      { to: "/$sekolah/akademik/kkm", label: "KKM" },
      { to: "/$sekolah/akademik/konfigurasi", label: "Konfigurasi" },
    ],
  },
  {
    label: "Penilaian",
    items: [
      { to: "/$sekolah/akademik/entri-nilai", label: "Entri Nilai" },
      { to: "/$sekolah/akademik/raport", label: "Raport" },
    ],
  },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { to: string; label: string; exact?: boolean }[];
  pathname: string;
}) {
  const tabs: TabItem[] = items.map((t) => ({
    key: t.to,
    label: t.label,
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => (
      <Link to={t.to} className={className}>
        {children}
      </Link>
    ),
  }));
  return (
    <div>
      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
        {label}
      </div>
      <Tabs items={tabs} />
    </div>
  );
}

function AkademikLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearch({ from: "/$sekolah/akademik" });
  const navigate = useNavigate({ from: "/$sekolah/akademik" });

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
        <AkademikContextBar />
        <div className="space-y-3">
          {NAV_GROUPS.map((g) => (
            <NavGroup key={g.label} label={g.label} items={g.items} pathname={pathname} />
          ))}
        </div>
        <Outlet />
      </div>
    </AkademikContextProvider>
  );
}

export const Route = createFileRoute("/$sekolah/akademik")({
  component: AkademikLayout,
  validateSearch: (search: Record<string, unknown>): AkademikSearch => {
    const out: AkademikSearch = {};
    if (typeof search.ta === "string" && search.ta) out.ta = search.ta;
    if (typeof search.semester === "string" && search.semester) out.semester = search.semester;
    return out;
  },
});

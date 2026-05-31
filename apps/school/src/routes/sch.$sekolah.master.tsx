import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";

// Master Data = pusat setup. Grup "Akademik" menampung master akademik yang
// dipindah dari modul Akademik (Tahun Ajaran, Kurikulum, Mapel, dll).
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Umum",
    items: [
      { to: "/sch/$sekolah/master", label: "Dashboard", exact: true },
      { to: "/sch/$sekolah/master/unit-jenjang", label: "Unit Jenjang" },
      { to: "/sch/$sekolah/master/pengguna", label: "Pengguna" },
    ],
  },
  {
    label: "Akademik",
    items: [
      { to: "/sch/$sekolah/master/tahun-ajaran", label: "Tahun Ajaran" },
      { to: "/sch/$sekolah/master/kurikulum", label: "Kurikulum" },
      { to: "/sch/$sekolah/master/mapel", label: "Mata Pelajaran" },
      { to: "/sch/$sekolah/master/komponen-nilai", label: "Komponen Nilai" },
      { to: "/sch/$sekolah/master/kkm", label: "KKM" },
      { to: "/sch/$sekolah/master/konfigurasi", label: "Konfigurasi" },
    ],
  },
];

function MasterLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master")({ component: MasterLayout });

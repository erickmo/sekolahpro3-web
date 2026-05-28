import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";
import { SesiKasBanner } from "../components/koperasi/SesiKasBanner";

/**
 * Konsolidasi nav 14 tab → 6 grup + sub-tab kontekstual.
 * Audit UX 2026-05-26 — horizontal overflow di tablet 1024px, beban kognitif tinggi.
 */
type NavItem = { to: string; label: string };

interface NavGroup {
  /** Anchor untuk grup (route default saat user klik header grup). */
  to: string;
  label: string;
  /** Daftar route anak yang dianggap milik grup ini (termasuk anchor itu sendiri). */
  members: NavItem[];
  /** True jika anchor harus match exact (mis. /koperasi). */
  exact?: boolean;
}

const GROUPS: NavGroup[] = [
  {
    to: "/$sekolah/koperasi",
    label: "Dashboard",
    exact: true,
    members: [{ to: "/$sekolah/koperasi", label: "Dashboard" }],
  },
  {
    to: "/$sekolah/koperasi/daftar",
    label: "Anggota & Rekening",
    members: [
      { to: "/$sekolah/koperasi/daftar", label: "Anggota" },
      { to: "/$sekolah/koperasi/rekening", label: "Rekening" },
    ],
  },
  {
    to: "/$sekolah/koperasi/workspace",
    label: "Operasional",
    members: [
      { to: "/$sekolah/koperasi/workspace", label: "Workspace" },
      { to: "/$sekolah/koperasi/transaksi", label: "Transaksi" },
      { to: "/$sekolah/koperasi/kas-teller", label: "Kas Teller" },
      { to: "/$sekolah/koperasi/kartu", label: "Kartu RFID" },
      { to: "/$sekolah/koperasi/emoney", label: "E-Money" },
    ],
  },
  {
    to: "/$sekolah/koperasi/pembiayaan",
    label: "Pembiayaan",
    members: [
      { to: "/$sekolah/koperasi/pembiayaan", label: "Akad" },
      { to: "/$sekolah/koperasi/angsuran", label: "Angsuran" },
    ],
  },
  {
    to: "/$sekolah/koperasi/zis",
    label: "Sosial",
    members: [
      { to: "/$sekolah/koperasi/zis", label: "ZIS" },
      { to: "/$sekolah/koperasi/wakaf", label: "Wakaf" },
      { to: "/$sekolah/koperasi/shu", label: "SHU" },
    ],
  },
  {
    to: "/$sekolah/koperasi/persetujuan",
    label: "Admin",
    members: [
      { to: "/$sekolah/koperasi/persetujuan", label: "Persetujuan" },
      { to: "/$sekolah/koperasi/period-close", label: "Period Close" },
      { to: "/$sekolah/koperasi/ppatk", label: "PPATK" },
      { to: "/$sekolah/koperasi/laporan", label: "Laporan" },
      { to: "/$sekolah/koperasi/pengaturan", label: "Pengaturan" },
    ],
  },
];

/** Cocokkan path aktif ke grup yang membawahinya. Match terpanjang menang. */
function matchActiveGroup(pathname: string): NavGroup | undefined {
  let best: { group: NavGroup; len: number } | undefined;
  for (const g of GROUPS) {
    for (const m of g.members) {
      const hit = pathname === m.to || pathname.startsWith(m.to + "/");
      if (hit && (!best || m.to.length > best.len)) {
        best = { group: g, len: m.to.length };
      }
    }
  }
  return best?.group;
}

function isMemberActive(pathname: string, item: NavItem): boolean {
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

function KoperasiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeGroup = matchActiveGroup(pathname);

  const groupTabs: TabItem[] = GROUPS.map((g) => ({
    key: g.to,
    label: g.label,
    active: activeGroup?.to === g.to,
    render: ({ className, children }) => (
      <Link to={g.to} className={className}>
        {children}
      </Link>
    ),
  }));

  // Sub-tab hanya muncul kalau grup punya ≥ 2 anggota (Dashboard skip).
  const showSubTabs = activeGroup && activeGroup.members.length > 1;
  const subTabs: TabItem[] = showSubTabs
    ? activeGroup!.members.map((m) => ({
        key: m.to,
        label: m.label,
        active: isMemberActive(pathname, m),
        render: ({ className, children }) => (
          <Link to={m.to} className={className}>
            {children}
          </Link>
        ),
      }))
    : [];

  return (
    <div className="space-y-4">
      <SesiKasBanner />
      <Tabs items={groupTabs} />
      {showSubTabs ? (
        <div className="-mt-2 border-b border-border/40 pb-px">
          <Tabs items={subTabs} />
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi")({ component: KoperasiLayout });

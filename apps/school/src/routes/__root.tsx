import { useEffect, useMemo, useRef, useState } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  AppShell,
  Avatar,
  Badge,
  SidebarNav,
  type SidebarNavSection,
  IconHome,
  IconUsers,
  IconBook,
  IconCalendar,
  IconGrad,
  IconId,
  IconFile,
  IconPlus,
  IconAlert,
  IconCheck,
  IconWallet,
  IconChat,
  IconChart,
  IconSettings,
  IconBell,
  IconSearch,
  IconLogout,
  SetupBanner,
} from "@sekolahpro/ui";
import { logout, useSession, useSessionStore } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";
import { useResourceList } from "@sekolahpro/api-client";
import { globalSearch, groupHitsByCategory } from "../lib/global-search";
import { scopedTo, scopedParams, scopedActivePath } from "../lib/scoped";

const SEARCH_MIN_QUERY = 2;
const SEARCH_MAX_HITS = 8;
const SEARCH_BLUR_DELAY_MS = 150;

function GlobalSearch({ sekolah }: { sekolah: string | undefined }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hits = useMemo(() => globalSearch(query, SEARCH_MAX_HITS), [query]);
  const groups = useMemo(() => groupHitsByCategory(hits), [hits]);
  const trimmed = query.trim();
  const showDropdown = open;

  function handleBlur() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setOpen(false), SEARCH_BLUR_DELAY_MS);
  }
  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  }
  function handleSelect() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative w-full">
      <span className="absolute inset-y-0 left-3 flex items-center text-muted-fg h-4 w-4 top-1/2 -translate-y-1/2">
        <IconSearch />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Cari siswa, guru, kelas..."
        className="h-9 w-full rounded-md border border-border bg-muted/40 pl-9 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted-fg">
          ⌘K
        </kbd>
      </span>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-auto rounded-md border border-border bg-bg shadow-lg">
          {trimmed.length < SEARCH_MIN_QUERY ? (
            <div className="px-3 py-3 text-xs text-muted-fg">
              Ketik minimal {SEARCH_MIN_QUERY} karakter untuk mencari siswa, guru, atau kelas.
            </div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-fg">
              Tidak ada hasil untuk &quot;{trimmed}&quot;.
            </div>
          ) : (
            <div className="py-1">
              {groups.map((g) => (
                <div key={g.category} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-fg">
                    {g.category}
                  </div>
                  {g.items.map((hit) => {
                    const body = (
                      <>
                        <span className="flex-1 truncate text-fg">{hit.label}</span>
                        {hit.meta ? (
                          <span className="truncate text-xs text-muted-fg">{hit.meta}</span>
                        ) : null}
                      </>
                    );
                    const cls = "flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted";
                    return sekolah ? (
                      <Link
                        key={hit.id}
                        to={scopedTo(sekolah, hit.href)}
                        params={scopedParams(sekolah)}
                        onClick={handleSelect}
                        onMouseDown={(e) => e.preventDefault()}
                        className={cls}
                      >
                        {body}
                      </Link>
                    ) : (
                      <Link
                        key={hit.id}
                        to="/pilih-sekolah"
                        onClick={handleSelect}
                        onMouseDown={(e) => e.preventDefault()}
                        className={cls}
                      >
                        {body}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-fg"
      >
        <span className="h-4 w-4"><IconBell /></span>
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-md border border-border bg-bg shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="text-sm font-medium text-fg">Notifikasi</div>
            <button
              type="button"
              className="text-[11px] text-brand hover:underline"
              onClick={() => setOpen(false)}
            >
              Tandai dibaca
            </button>
          </div>
          <div className="px-3 py-6 text-center text-xs text-muted-fg">
            Belum ada notifikasi baru.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AvatarMenu({
  name,
  onLogout,
  sekolah,
}: {
  name: string;
  onLogout: () => void;
  sekolah: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 border-l border-border rounded-r-md hover:bg-muted/60 pr-2 py-1"
      >
        <Avatar name={name} size="sm" />
        <div className="hidden sm:block leading-tight text-left">
          <div className="text-sm font-medium text-fg truncate max-w-[140px]">
            {name}
          </div>
          <div className="text-[11px] text-muted-fg">Admin Sekolah</div>
        </div>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-bg shadow-lg py-1">
          {sekolah ? (
            <Link
              to={scopedTo(sekolah, "/pengaturan")}
              params={scopedParams(sekolah)}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-fg hover:bg-muted"
            >
              Pengaturan akun
            </Link>
          ) : (
            <Link
              to="/pilih-sekolah"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-fg hover:bg-muted"
            >
              Pengaturan akun
            </Link>
          )}
          {sekolah ? (
            <Link
              to={scopedTo(sekolah, "/pengaturan")}
              params={scopedParams(sekolah)}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-fg hover:bg-muted"
            >
              Profil
            </Link>
          ) : (
            <Link
              to="/pilih-sekolah"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-fg hover:bg-muted"
            >
              Profil
            </Link>
          )}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-muted"
          >
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}

const ROLE_MENU_MAP: Record<string, string[]> = {
  super_admin: ["*"],
  admin_sekolah: ["*"],
  kepala_sekolah: [
    "/",
    "/siswa",
    "/guru",
    "/staff",
    "/kelas",
    "/akademik",
    "/jadwal",
    "/absensi",
    "/ppdb",
    "/keuangan",
    "/laporan",
    "/pengaturan",
  ],
  operator: ["/", "/siswa", "/guru", "/kelas", "/jadwal", "/absensi", "/ppdb", "/pesan"],
  guru: ["/", "/siswa", "/kelas", "/akademik", "/jadwal", "/absensi", "/pesan"],
  bendahara: ["/", "/siswa", "/keuangan", "/koperasi", "/ppdb", "/laporan", "/pesan"],
  pustakawan: ["/", "/perpustakaan", "/siswa", "/pesan"],
  petugas_koperasi: ["/", "/koperasi", "/siswa", "/pesan"],
};

function canSee(to: string, roles: string[]): boolean {
  for (const role of roles) {
    const allowed = ROLE_MENU_MAP[role];
    if (!allowed) continue;
    if (allowed.includes("*")) return true;
    if (allowed.includes(to)) return true;
  }
  return false;
}

type SidebarItem = SidebarNavSection["items"][number] & { to: string };

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, hsl(222 89% 55%), hsl(262 83% 58%))",
        }}
      >
        S
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg truncate max-w-[150px]">
          {name}
        </div>
        <div className="text-[11px] text-muted-fg">Portal Sekolah</div>
      </div>
    </div>
  );
}

function Layout() {
  const session = useSession();
  const tenant = useTenant();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // `__root` lives outside the `/$sekolah` segment, so `useParams` can't read
  // the slug. Pull it from the persisted session store instead — set by the
  // chooser route after `select_school` succeeds.
  const slug = useSessionStore((s) => s.activeSekolah?.slug);

  // Setup-banner gate: probe Tahun Ajaran with aktif=1; show banner only on
  // a definitive empty result so banner does not flash during initial fetch.
  // Hook MUST stay above early returns — otherwise hook count varies between
  // renders (loading → authenticated) and React throws
  // "Rendered fewer hooks than expected".
  const taActiveQ = useResourceList<{ name: string }>(
    "Tahun Ajaran",
    {
      filters: { aktif: 1 },
      fields: ["name"],
      limit_page_length: 1,
    },
    { enabled: session.status === "authenticated" },
  );

  useEffect(() => {
    if (session.status === "guest" && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [session.status, pathname, navigate]);

  // Auth lapsed mid-session: API 401/403 → force logout, redirect to /login.
  useEffect(() => {
    const err = taActiveQ.error as { status?: number } | null;
    if (err && (err.status === 401 || err.status === 403)) {
      void logout().then(() => navigate({ to: "/login" }));
    }
  }, [taActiveQ.error, navigate]);

  if (session.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-fg">
        Memuat...
      </div>
    );
  }
  if (session.status === "guest") {
    if (pathname === "/login") return <Outlet />;
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-fg">
        Mengarahkan...
      </div>
    );
  }

  const mk = (to: string, label: string, icon: React.ReactNode, badge?: string | number): SidebarItem => {
    const livePath = scopedActivePath(slug, to);
    return {
      to,
      label,
      icon,
      badge,
      active: slug ? pathname === livePath : false,
      render: ({ className, children }: { className: string; children: React.ReactNode }) =>
        slug ? (
          <Link to={scopedTo(slug, to)} params={scopedParams(slug)} className={className}>
            {children}
          </Link>
        ) : (
          <Link to="/pilih-sekolah" className={className}>
            {children}
          </Link>
        ),
    };
  };

  const roles = session.roles && session.roles.length > 0 ? session.roles : ["admin_sekolah"];

  const rawSections: { title: string; items: SidebarItem[] }[] = [
    {
      title: "Utama",
      items: [
        mk("/", "Dashboard", <IconHome />),
        mk("/siswa", "Siswa", <IconUsers />),
        mk("/guru", "Guru", <IconGrad />),
        mk("/staff", "Staff", <IconId />),
        mk("/kelas", "Kelas", <IconBook />),
      ],
    },
    {
      title: "Akademik",
      items: [
        mk("/akademik", "Akademik", <IconBook />),
        mk("/jadwal", "Jadwal", <IconCalendar />),
        mk("/absensi", "Absensi", <IconCheck />),
      ],
    },
    {
      title: "Layanan",
      items: [
        mk("/ppdb", "PPDB", <IconPlus />),
        mk("/perpustakaan", "Perpustakaan", <IconFile />),
        mk("/koperasi", "Koperasi", <IconWallet />),
      ],
    },
    {
      title: "Operasional",
      items: [
        mk("/keuangan", "Keuangan", <IconWallet />, 3),
        mk("/pesan", "Pesan", <IconChat />),
        mk("/laporan", "Laporan", <IconChart />),
      ],
    },
    {
      title: "Infrastruktur & Master",
      items: [
        mk("/infrastruktur", "Infrastruktur", <IconHome />),
        mk("/master", "Master Data", <IconSettings />),
      ],
    },
    {
      title: "Lainnya",
      items: [
        mk("/audit", "Audit Log", <IconAlert />),
        mk("/pengaturan", "Pengaturan", <IconSettings />),
      ],
    },
  ];

  const filtered = rawSections
    .map((s) => ({ ...s, items: s.items.filter((it) => canSee(it.to, roles)) }))
    .filter((s) => s.items.length > 0);

  // Defensive: if filtering produced an empty sidebar, fall back to all items.
  const sections: SidebarNavSection[] = filtered.length > 0 ? filtered : rawSections;

  const tenantName = tenant.data?.name ?? "SekolahPro";
  const taAktif = (taActiveQ.data?.length ?? 0) > 0;
  const showSetupBanner =
    pathname !== "/login" && taActiveQ.isSuccess && !taAktif;

  if (pathname === "/pilih-sekolah") return <Outlet />;

  return (
    <AppShell
      brand={<Brand name={tenantName} />}
      sidebar={
        <SidebarNav
          sections={sections}
          footer={
            <button
              onClick={() => {
                void logout().then(() => navigate({ to: "/login" }));
              }}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-fg hover:bg-muted hover:text-fg transition-colors"
            >
              <span className="h-4 w-4"><IconLogout /></span>
              Keluar
            </button>
          }
        />
      }
      topbar={
        <div className="flex w-full items-center gap-4">
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <GlobalSearch sekolah={slug} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {session.activeSekolah ? (
              <button
                type="button"
                onClick={() => navigate({ to: "/pilih-sekolah" })}
                title="Ganti sekolah"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted text-sm font-medium text-fg max-w-[220px]"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-brand/80 to-brand text-white text-[10px] font-semibold">
                  {session.activeSekolah.nama
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="truncate">{session.activeSekolah.nama}</span>
                <span className="text-muted-fg text-xs">⇄</span>
              </button>
            ) : null}
            <Badge tone="success" dot>Live</Badge>
            <NotificationDropdown />
            <AvatarMenu
              name={session.user}
              sekolah={slug}
              onLogout={() => {
                void logout().then(() => navigate({ to: "/login" }));
              }}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {showSetupBanner ? (
          <SetupBanner
            tone="danger"
            title="Tahun Ajaran belum aktif"
            description="Modul absensi, akademik, dan jadwal membutuhkan Tahun Ajaran aktif untuk berfungsi normal."
            actionLabel="Atur Tahun Ajaran"
            actionHref="/master/tahun-ajaran"
            renderLink={(href, children) =>
              slug ? (
                <Link to={scopedTo(slug, href)} params={scopedParams(slug)}>
                  {children}
                </Link>
              ) : (
                <Link to="/pilih-sekolah">{children}</Link>
              )
            }
          />
        ) : null}
        <Outlet />
      </div>
    </AppShell>
  );
}

export const Route = createRootRoute({ component: Layout });

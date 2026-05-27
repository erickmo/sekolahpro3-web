import { useEffect } from "react";
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
  IconChart,
  IconCalendar,
  IconCheck,
  IconChat,
  IconBell,
  IconLogout,
  IconWallet,
} from "@sekolahpro/ui";
import { logout, useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, hsl(262 83% 58%), hsl(292 76% 50%))",
        }}
      >
        S
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg truncate max-w-[150px]">
          {name}
        </div>
        <div className="text-[11px] text-muted-fg">Portal Siswa</div>
      </div>
    </div>
  );
}

function Layout() {
  const session = useSession();
  const tenant = useTenant();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (session.status === "guest" && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [session.status, pathname, navigate]);

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

  const mk = (to: string, label: string, icon: React.ReactNode, badge?: string | number) => ({
    label,
    icon,
    badge,
    active: pathname === to,
    render: ({ className, children }: { className: string; children: React.ReactNode }) => (
      <Link to={to} className={className}>{children}</Link>
    ),
  });

  const sections: SidebarNavSection[] = [
    {
      title: "Belajar",
      items: [
        mk("/", "Beranda", <IconHome />),
        mk("/nilai", "Nilai", <IconChart />),
        mk("/jadwal", "Jadwal", <IconCalendar />),
        mk("/absensi", "Absensi", <IconCheck />),
      ],
    },
    {
      title: "Koperasi",
      items: [
        mk("/koperasi", "Ringkasan", <IconWallet />),
        mk("/koperasi/mutasi", "Mutasi", <IconChart />),
        mk("/koperasi/pembiayaan", "Pembiayaan", <IconCheck />),
      ],
    },
    {
      title: "Komunikasi",
      items: [mk("/pesan", "Pesan", <IconChat />, 2)],
    },
  ];

  const tenantName = tenant.data?.name ?? "SekolahPro";

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
        <div className="flex w-full items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-xs text-muted-fg">Semester Ganjil 2026</div>
            <div className="text-sm font-semibold text-fg">Selamat belajar!</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge tone="brand" dot>Online</Badge>
            <button
              aria-label="Notifikasi"
              className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-fg"
            >
              <span className="h-4 w-4"><IconBell /></span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <Avatar name={session.user} size="sm" />
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-medium text-fg truncate max-w-[140px]">
                  {session.user}
                </div>
                <div className="text-[11px] text-muted-fg">Siswa</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: Layout });

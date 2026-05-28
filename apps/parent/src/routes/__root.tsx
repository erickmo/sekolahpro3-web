import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  AppShell,
  SidebarNav,
  type SidebarNavSection,
  IconHome,
  IconCalendar,
  IconChart,
  IconCheck,
  IconChat,
  IconLogout,
  IconWallet,
  IconId,
} from "@sekolahpro/ui";
import { logout, useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";
import { ChildSwitcher } from "../components/ChildSwitcher";

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
        P
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg truncate max-w-[150px]">
          {name}
        </div>
        <div className="text-[11px] text-muted-fg">Portal Orang Tua</div>
      </div>
    </div>
  );
}

function RootLayout() {
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

  const mk = (
    to: string,
    label: string,
    icon: ReactNode,
    badge?: string | number,
  ) => ({
    label,
    icon,
    badge,
    active: pathname === to,
    render: ({
      className,
      children,
    }: {
      className: string;
      children: ReactNode;
    }) => (
      <Link to={to} className={className}>
        {children}
      </Link>
    ),
  });

  const sections: SidebarNavSection[] = [
    {
      items: [
        mk("/", "Dashboard", <IconHome />),
        mk("/jadwal", "Jadwal", <IconCalendar />),
        mk("/nilai", "Nilai", <IconChart />),
        mk("/absensi", "Absensi", <IconCheck />),
        mk("/pesan", "Pesan", <IconChat />),
        mk("/pembayaran", "Pembayaran", <IconWallet />),
        mk("/profil", "Profil", <IconId />),
      ],
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
              type="button"
              onClick={() => {
                void logout().then(() => navigate({ to: "/login" }));
              }}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-fg hover:bg-muted hover:text-fg transition-colors"
            >
              <span className="h-4 w-4">
                <IconLogout />
              </span>
              Keluar
            </button>
          }
        />
      }
      topbar={
        <div className="flex w-full items-center gap-3">
          <ChildSwitcher />
          <div className="ml-auto" />
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: RootLayout });

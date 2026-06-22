import { useEffect, useRef, useState } from "react";
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
  IconCalendar,
  IconCheck,
  IconFile,
  IconLogout,
} from "@sekolahpro/ui";
import { logout, useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold shadow-sm"
        style={{
          background: "linear-gradient(135deg, hsl(222 89% 55%), hsl(262 83% 58%))",
        }}
      >
        G
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg truncate max-w-[150px]">{name}</div>
        <div className="text-[11px] text-muted-fg">Portal Guru &amp; Staff</div>
      </div>
    </div>
  );
}

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
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

function AvatarMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
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
          <div className="text-sm font-medium text-fg truncate max-w-[140px]">{name}</div>
          <div className="text-[11px] text-muted-fg">Pegawai</div>
        </div>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-bg shadow-lg py-1">
          <Link
            to="/profil"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-fg hover:bg-muted"
          >
            Profil
          </Link>
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

type NavTo = "/" | "/cuti" | "/absensi" | "/sk" | "/profil";

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
      <div className="min-h-screen flex items-center justify-center text-muted-fg">Memuat...</div>
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

  const mk = (to: NavTo, label: string, icon: React.ReactNode) => ({
    label,
    icon,
    active: pathname === to,
    render: ({ className, children }: { className: string; children: React.ReactNode }) => (
      <Link to={to} className={className}>
        {children}
      </Link>
    ),
  });

  const sections: SidebarNavSection[] = [
    {
      title: "Kepegawaian",
      items: [
        mk("/", "Beranda", <IconHome />),
        mk("/cuti", "Cuti Saya", <IconCalendar />),
        mk("/absensi", "Absensi Saya", <IconCheck />),
        mk("/sk", "SK Saya", <IconFile />),
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
          <div className="hidden sm:block">
            <div className="text-xs text-muted-fg">Portal Guru &amp; Staff</div>
            <div className="text-sm font-semibold text-fg">Selamat bekerja!</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge tone="success" dot>
              Online
            </Badge>
            <AvatarMenu
              name={session.user ?? ""}
              onLogout={() => {
                void logout().then(() => navigate({ to: "/login" }));
              }}
            />
          </div>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: Layout });

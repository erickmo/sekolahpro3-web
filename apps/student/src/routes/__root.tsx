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
  IconChart,
  IconCalendar,
  IconCheck,
  IconBell,
  IconLogout,
  IconBook,
  IconChat,
  IconId,
} from "@sekolahpro/ui";
import { logout, useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";
import { notifikasiSiswa, type NotifikasiTone } from "../data/notifikasi";

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
        <div className="text-[11px] text-muted-fg">Portal Siswa</div>
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

const toneDot: Record<NotifikasiTone, string> = {
  info: "bg-brand",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
};

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifikasiSiswa);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const unread = items.filter((n) => !n.read).length;
  const markAllRead = () => setItems((xs) => xs.map((n) => ({ ...n, read: true })));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-fg"
      >
        <span className="h-4 w-4"><IconBell /></span>
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-md border border-border bg-bg shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="text-sm font-medium text-fg">
              Notifikasi{unread > 0 ? ` (${unread})` : ""}
            </div>
            <button
              type="button"
              className="text-[11px] text-brand hover:underline disabled:opacity-50"
              onClick={markAllRead}
              disabled={unread === 0}
            >
              Tandai dibaca
            </button>
          </div>
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-fg">
              Belum ada notifikasi baru.
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-3 py-3 ${n.read ? "" : "bg-muted/30"}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${toneDot[n.tone]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg truncate">{n.title}</div>
                    <div className="text-xs text-muted-fg line-clamp-2">{n.body}</div>
                    <div className="text-[11px] text-muted-fg mt-1">{n.ago}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
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
          <div className="text-sm font-medium text-fg truncate max-w-[140px]">
            {name}
          </div>
          <div className="text-[11px] text-muted-fg">Siswa</div>
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

type NavTo =
  | "/"
  | "/nilai"
  | "/jadwal"
  | "/absensi"
  | "/qr"
  | "/tugas"
  | "/pesan"
  | "/profil";

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

  const mk = (to: NavTo, label: string, icon: React.ReactNode, badge?: string | number) => ({
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
        mk("/jadwal", "Jadwal", <IconCalendar />),
        mk("/absensi", "Absensi", <IconCheck />),
        mk("/qr", "Kartu QR", <IconId />),
        mk("/nilai", "Nilai", <IconChart />),
        mk("/tugas", "Tugas", <IconBook />),
      ],
    },
    {
      title: "Komunikasi",
      items: [mk("/pesan", "Pesan", <IconChat />)],
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
            <div className="text-xs text-muted-fg">Semester Ganjil 2026/2027</div>
            <div className="text-sm font-semibold text-fg">Selamat belajar!</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge tone="success" dot>Online</Badge>
            <NotificationDropdown />
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

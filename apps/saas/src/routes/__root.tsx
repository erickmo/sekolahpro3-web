import { createRootRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  AppShell,
  SidebarNav,
  type SidebarNavSection,
  IconHome,
  IconUsers,
  IconWallet,
  IconChart,
  IconSettings,
  IconLogout,
  IconFlag,
  IconFile,
  IconLayers,
} from "@sekolahpro/ui";
import { RequireAuth, useSession, logout } from "@sekolahpro/auth";

const SIDEBAR_SECTIONS: Array<{
  title?: string;
  items: Array<{ to: string; label: string; icon: React.ReactNode }>;
}> = [
  {
    items: [
      { to: "/", label: "Overview", icon: <IconHome /> },
    ],
  },
  {
    title: "Tenancy",
    items: [
      { to: "/tenants", label: "Tenants", icon: <IconUsers /> },
      { to: "/plans", label: "Plans", icon: <IconChart /> },
      { to: "/billing", label: "Billing", icon: <IconWallet /> },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/users", label: "Staff & Roles", icon: <IconUsers /> },
      { to: "/ops", label: "Ops & Health", icon: <IconSettings /> },
    ],
  },
  {
    title: "Ads",
    items: [
      { to: "/ads", label: "Dashboard", icon: <IconChart /> },
      { to: "/ads/campaigns", label: "Campaigns", icon: <IconFlag /> },
      { to: "/ads/creatives", label: "Creatives", icon: <IconFile /> },
      { to: "/ads/properties", label: "Properties", icon: <IconLayers /> },
      { to: "/ads/slots", label: "Slots", icon: <IconLayers /> },
      { to: "/ads/customers", label: "Customers", icon: <IconUsers /> },
      { to: "/ads/groups", label: "Groups", icon: <IconLayers /> },
    ],
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <div className="h-8 w-8 rounded-md bg-brand text-white flex items-center justify-center text-sm font-bold">SP</div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">SekolahPro</div>
        <div className="text-[11px] text-muted-fg">SaaS Admin</div>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sections: SidebarNavSection[] = SIDEBAR_SECTIONS.map((sec) => ({
    ...(sec.title ? { title: sec.title } : {}),
    items: sec.items.map((it) => ({
      label: it.label,
      icon: it.icon,
      active: it.to === "/" ? pathname === "/" : pathname.startsWith(it.to),
      render: ({ className, children }) => (
        <Link to={it.to} className={className}>
          {children}
        </Link>
      ),
    })),
  }));

  return (
    <div className="flex h-full flex-col">
      <Brand />
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav sections={sections} />
      </div>
    </div>
  );
}

function Topbar() {
  const session = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate({ to: "/login" });
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 px-4">
      <div className="text-sm text-muted-fg">Internal admin console</div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{session.user ?? "—"}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <span className="h-3.5 w-3.5"><IconLogout /></span>
          Logout
        </button>
      </div>
    </div>
  );
}

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/login") return <Outlet />;
  return (
    <RequireAuth roles={["SekolahPro Admin"]} fallback={<div className="p-6">Loading...</div>}>
      <AppShell sidebar={<Sidebar />} topbar={<Topbar />}>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

export const Route = createRootRoute({ component: Layout });

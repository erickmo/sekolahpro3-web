import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { AppShell } from "@sekolahpro/ui";
import { RequireAuth, useSession } from "@sekolahpro/auth";

function Layout() {
  const session = useSession();

  return (
    <RequireAuth roles={["SekolahPro Admin"]} fallback={<div className="p-6">Loading...</div>}>
      <AppShell
        sidebar={
          <nav className="p-4 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-muted">Tenants</Link>
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-muted">Domains</Link>
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-muted">Billing</Link>
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-muted">Ops</Link>
          </nav>
        }
        topbar={
          <div className="flex w-full items-center justify-between">
            <span className="font-semibold">SekolahPro Admin</span>
            <span className="text-sm text-muted-fg">{session.user}</span>
          </div>
        }
      >
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

export const Route = createRootRoute({ component: Layout });

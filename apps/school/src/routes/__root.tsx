import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { AppShell } from "@sekolahpro/ui";
import { useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";

function Layout() {
  const session = useSession();
  const tenant = useTenant();

  if (session.status === "loading") return <div className="p-6">Loading...</div>;
  if (session.status === "guest") {
    return (
      <div className="p-6">
        <Link to="/login" className="text-brand underline">Login</Link>
      </div>
    );
  }

  return (
    <AppShell
      sidebar={
        <nav className="p-4 space-y-2">
          <Link to="/" className="block px-3 py-2 rounded-md hover:bg-muted">Beranda</Link>
        </nav>
      }
      topbar={
        <div className="flex w-full items-center justify-between">
          <span className="font-semibold">{tenant.data?.name ?? "SekolahPro"}</span>
          <span className="text-sm text-muted-fg">{session.user}</span>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: Layout });

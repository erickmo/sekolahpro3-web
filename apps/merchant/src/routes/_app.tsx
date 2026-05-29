import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@sekolahpro/auth";
import { OfflineBanner } from "../components/OfflineBanner";
import { useConnectivity } from "../lib/connectivity";

function pingFn() {
  return fetch("/api/method/ping")
    .then((r) => r.ok)
    .catch(() => false);
}

function AppShell() {
  const nav = useNavigate();
  const session = useSession();
  const { online } = useConnectivity({ pingFn, intervalMs: 15000 });
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (session.status === "guest") {
      nav({ to: "/login" });
    }
  }, [session.status, nav]);

  const tab = (to: string, label: string) => (
    <Link
      // routes for catalog/transaksi/laporan/pengaturan land in later tasks;
      // cast keeps the bottom-nav declarative without blocking typecheck now.
      to={to as never}
      className={`flex-1 text-center py-2 ${
        path.startsWith(to) ? "font-semibold" : ""
      }`}
    >
      {label}
    </Link>
  );

  if (session.status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <OfflineBanner online={online} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <nav className="flex border-t bg-bg">
        {tab("/_app/pos", "POS")}
        {tab("/_app/catalog", "Katalog")}
        {tab("/_app/transaksi", "Transaksi")}
        {tab("/_app/laporan", "Laporan")}
        {tab("/_app/pengaturan", "Setelan")}
      </nav>
    </div>
  );
}

export const Route = createFileRoute("/_app")({ component: AppShell });

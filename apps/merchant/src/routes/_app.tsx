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

type TabKey = "/pos" | "/catalog" | "/transaksi" | "/laporan" | "/pengaturan";

/** Minimal inline icons (ui exports none) sized to the tab bar. */
function TabIcon({ k }: { k: TabKey }) {
  const p: Record<TabKey, string> = {
    "/pos": "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    "/catalog": "M4 6h16M4 12h16M4 18h16",
    "/transaksi": "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6",
    "/laporan": "M4 20V10M10 20V4M16 20v-8M22 20H2",
    "/pengaturan": "M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-5l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.5h5l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={p[k]} />
    </svg>
  );
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

  const tab = (to: TabKey, label: string) => {
    const active = path.startsWith(to);
    return (
      <Link
        to={to}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition ${
          active ? "font-semibold text-brand" : "text-muted-fg hover:text-fg"
        }`}
      >
        <TabIcon k={to} />
        {label}
      </Link>
    );
  };

  if (session.status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-semibold tracking-tight">SekolahPro POS</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-fg">
          <span
            className={`h-2 w-2 rounded-full ${online ? "bg-brand" : "bg-danger"}`}
            aria-hidden="true"
          />
          {online ? "Daring" : "Luring"}
        </span>
      </header>
      <OfflineBanner online={online} />
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
      <nav className="flex border-t border-border bg-bg">
        {tab("/pos", "POS")}
        {tab("/catalog", "Katalog")}
        {tab("/transaksi", "Transaksi")}
        {tab("/laporan", "Laporan")}
        {tab("/pengaturan", "Setelan")}
      </nav>
    </div>
  );
}

export const Route = createFileRoute("/_app")({ component: AppShell });

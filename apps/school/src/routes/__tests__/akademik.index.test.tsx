/**
 * Tests for the Akademik TA hub component (sch.$sekolah.akademik.index).
 *
 * Covers Fase 1 single-door Task 7:
 *  - go-forwarding: a resolvable stored TA + `?go=` auto-redirects into the
 *    workspace SUBPATH (not just the workspace root); an invalid `go` falls back
 *    to the workspace root (go dropped).
 *  - pick-link passthrough: when the picker renders (no auto-redirect) and `go`
 *    is present, opening a TA carries the go forward into its subpath.
 *  - PPDB next-TA card: shows the count + a PPDB Link when an upcoming TA has
 *    tagged rows; renders WITHOUT a numeric badge on 0 rows (no "0 pendaftar"
 *    lie); still renders + links to PPDB when there is no upcoming TA.
 *
 * Router is stubbed so the page renders without a RouterProvider; navigation is
 * asserted through the navigate spy + Link hrefs, never implementation details.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mutable router state per test.
const navigateSpy = vi.fn();
let searchState: { pick?: number; go?: string } = {};

// Router stub:
//  - Link renders an anchor whose href encodes `to` + params/search so tests
//    can assert the built target without a real router.
//  - useNavigate returns the shared spy (auto-redirect + pick-link escape hatch).
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "sek-uji" }),
  useSearch: () => searchState,
  useNavigate: () => navigateSpy,
  Link: ({
    to,
    params,
    search,
    children,
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, unknown>;
    children: ReactNode;
  }) => {
    const q = search ? `?${new URLSearchParams(search as Record<string, string>).toString()}` : "";
    return (
      <a data-to={to} data-params={JSON.stringify(params ?? {})} href={`${to}${q}`}>
        {children}
      </a>
    );
  },
}));

// API stub: TA list + Pendaftaran PPDB count are both served by useResourceList.
// First call (Tahun Ajaran) returns taRows; the PPDB call returns ppdbRows when
// enabled. We branch on the doctype arg.
let taRows: Array<Record<string, unknown>> = [];
let ppdbRows: Array<Record<string, unknown>> = [];
const useResourceListMock = vi.fn((doctype: string, _params?: unknown, options?: { enabled?: boolean }) => {
  if (doctype === "Tahun Ajaran") return { data: taRows, isLoading: false, isError: false };
  if (doctype === "Pendaftaran PPDB") {
    const enabled = options?.enabled ?? true;
    return { data: enabled ? ppdbRows : undefined, isLoading: false, isError: false };
  }
  return { data: [], isLoading: false, isError: false };
});
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (doctype: string, params?: unknown, options?: { enabled?: boolean }) =>
    useResourceListMock(doctype, params, options),
}));

// localStorage stub for readStoredPeriode (stored TA → auto-redirect candidate).
let storedTa: string | undefined;
vi.mock("../../lib/akademikPeriode", async () => {
  const actual = await vi.importActual<typeof import("../../lib/akademikPeriode")>(
    "../../lib/akademikPeriode",
  );
  return {
    ...actual,
    readStoredPeriode: () => ({ ta: storedTa }),
  };
});

import { AkademikHubPage } from "../sch.$sekolah.akademik.index";

// A running TA whose window straddles "today", so pickAutoRedirectTa keeps it
// (non-past) and the auto-redirect fires. Name carries a slash to prove taPath
// encoding survives in the built href.
const RUNNING_TA = {
  name: "SEK-2025/2026",
  nama: "2025/2026",
  is_current: 1 as const,
  status: "Aktif",
  tanggal_mulai: "2000-07-01",
  tanggal_selesai: "2999-06-30",
};

// A future TA (starts well after any plausible "today") so pickNextTa hits it.
const NEXT_TA = {
  name: "SEK-2999/3000",
  nama: "2999/3000",
  is_current: 0 as const,
  status: "Aktif",
  tanggal_mulai: "2999-07-01",
  tanggal_selesai: "3000-06-30",
};

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  navigateSpy.mockReset();
  useResourceListMock.mockClear();
  searchState = {};
  storedTa = undefined;
  taRows = [];
  ppdbRows = [];
});
afterEach(() => cleanup());

describe("AkademikHubPage — go-forwarding (auto-redirect)", () => {
  it("forwards a valid go into the workspace subpath of the resolved TA", () => {
    taRows = [RUNNING_TA];
    storedTa = RUNNING_TA.name;
    searchState = { go: "kelas/rombel" };

    wrap(<AkademikHubPage />);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const arg = navigateSpy.mock.calls[0][0];
    expect(arg.replace).toBe(true);
    expect(arg.href).toBe("/sch/sek-uji/akademik/SEK-2025%2F2026/kelas/rombel");
  });

  it("drops an invalid go and lands on the workspace root (typed navigation)", () => {
    taRows = [RUNNING_TA];
    storedTa = RUNNING_TA.name;
    searchState = { go: "keuangan" }; // unknown root → parseGoParam null

    wrap(<AkademikHubPage />);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const arg = navigateSpy.mock.calls[0][0];
    // Typed to + params, no href. The TA name is passed RAW — the router encodes
    // the segment once; taPath here would double-encode and break taRow lookup.
    expect(arg.href).toBeUndefined();
    expect(arg.to).toBe("/sch/$sekolah/akademik/$ta");
    expect(arg.params).toEqual({ sekolah: "sek-uji", ta: "SEK-2025/2026" });
    expect(arg.replace).toBe(true);
  });

  it("drops a traversal go and lands on the workspace root", () => {
    taRows = [RUNNING_TA];
    storedTa = RUNNING_TA.name;
    searchState = { go: "kelas/../x" };

    wrap(<AkademikHubPage />);

    const arg = navigateSpy.mock.calls[0][0];
    expect(arg.href).toBeUndefined();
    expect(arg.to).toBe("/sch/$sekolah/akademik/$ta");
  });
});

describe("AkademikHubPage — pick-link passthrough", () => {
  it("carries go into the subpath when opening a TA from the picker", () => {
    taRows = [RUNNING_TA];
    storedTa = RUNNING_TA.name;
    searchState = { pick: 1, go: "jadwal/papan" }; // pick=1 suppresses auto-redirect

    wrap(<AkademikHubPage />);

    // Auto-redirect must be suppressed by pick=1.
    expect(navigateSpy).not.toHaveBeenCalled();

    // Opening the featured TA forwards via the navigate href escape hatch.
    // Exact name "Buka" avoids the PPDB card's "Buka PPDB →" action.
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy.mock.calls[0][0].href).toBe(
      "/sch/sek-uji/akademik/SEK-2025%2F2026/jadwal/papan",
    );
  });

  it("opens the plain workspace root (typed Link) when no go is present", () => {
    taRows = [RUNNING_TA];
    searchState = { pick: 1 }; // no go

    wrap(<AkademikHubPage />);

    const openLink = screen.getByRole("link", { name: "Buka" });
    expect(openLink.getAttribute("data-to")).toBe("/sch/$sekolah/akademik/$ta");
    // RAW name in params (router encodes once); was %2F-double-encoded before the fix.
    expect(openLink.getAttribute("data-params")).toContain("SEK-2025/2026");
  });
});

describe("AkademikHubPage — PPDB next-TA card", () => {
  it("shows the count + PPDB link when an upcoming TA has tagged rows", () => {
    taRows = [RUNNING_TA, NEXT_TA];
    storedTa = undefined; // no auto-redirect (first visit) so the hub renders
    searchState = { pick: 1 };
    ppdbRows = [{ name: "P-1" }, { name: "P-2" }, { name: "P-3" }];

    wrap(<AkademikHubPage />);

    // Card titled around the upcoming TA name (exact title avoids matching the
    // SectionCard description, which also embeds the year).
    expect(screen.getByText("PPDB 2999/3000")).toBeInTheDocument();
    // Numeric count badge present (count = 3).
    expect(screen.getByText(/3\s+pendaftar/i)).toBeInTheDocument();
    // Links to PPDB.
    const ppdbLink = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("data-to") === "/sch/$sekolah/akademik/ppdb");
    expect(ppdbLink).toBeTruthy();
  });

  it("renders WITHOUT a numeric badge when the upcoming TA has 0 tagged rows", () => {
    taRows = [RUNNING_TA, NEXT_TA];
    searchState = { pick: 1 };
    ppdbRows = []; // 0 rows → no "0 pendaftar" lie

    wrap(<AkademikHubPage />);

    expect(screen.getByText("PPDB 2999/3000")).toBeInTheDocument();
    // No count badge of the form "<n> pendaftar".
    expect(screen.queryByText(/\d+\s+pendaftar/i)).toBeNull();
    // Still links to PPDB.
    const ppdbLink = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("data-to") === "/sch/$sekolah/akademik/ppdb");
    expect(ppdbLink).toBeTruthy();
  });

  it("renders the card with no count + PPDB link when there is no upcoming TA", () => {
    taRows = [RUNNING_TA]; // only a running TA, none upcoming
    searchState = { pick: 1 };

    wrap(<AkademikHubPage />);

    // The PPDB call must be disabled (no next TA) → no rows requested.
    const ppdbCall = useResourceListMock.mock.calls.find((c) => c[0] === "Pendaftaran PPDB");
    expect(ppdbCall?.[2]?.enabled).toBe(false);
    expect(screen.queryByText(/\d+\s+pendaftar/i)).toBeNull();
    const ppdbLink = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("data-to") === "/sch/$sekolah/akademik/ppdb");
    expect(ppdbLink).toBeTruthy();
  });
});

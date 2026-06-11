/**
 * Tests untuk "Tautan Modul" card di workspace dashboard Akademik.
 *
 * Cakupan:
 *  - Tiga link (Buka PPDB / Buka Absensi / Buka Laporan) ter-render.
 *  - Setiap link membawa href/to yang merujuk ke rute yang benar.
 *
 * Router + api-client di-stub agar render tidak membutuhkan root router
 * maupun backend Frappe.
 *
 * NOTE bug-032: label link TIDAK boleh sama persis dengan teks apapun di
 * GUIDE_STEPS/GUIDE_TIPS di halaman yang sama agar getByText unik.
 * Periksa GUIDE_STEPS di sch.$sekolah.akademik.$ta.index.tsx sebelum
 * mengubah label di sini.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Route } from "../sch.$sekolah.akademik.$ta.index";

const TEST_SEKOLAH = "sd-aletheia-malang";
const TEST_TA = "2024-2025";

// Router stub: Link renders as <a href={to}>, useParams returns test fixtures,
// createFileRoute returns no-op factory.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: TEST_SEKOLAH, ta: TEST_TA }),
  Link: ({
    children,
    to,
    params,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => {
    // Substitute $sekolah so href reflects real URL shape.
    const href = params?.sekolah ? to.replace("$sekolah", params.sekolah) : to;
    return <a href={href}>{children}</a>;
  },
}));

// api-client stub: useResourceList returns empty data, useFrappeMethod returns
// undefined data — enough for the dashboard to render without crashing.
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useFrappeMethod: () => ({ data: undefined, isLoading: false }),
}));

// Akademik context + role stubs — dashboard renders fine without a real context.
vi.mock("../../lib/akademikContext", () => ({
  useAkademikContextOptional: () => null,
}));
vi.mock("../../lib/akademikRole", () => ({
  useAkademikRole: () => ({ primary: "admin" }),
  ROLE_LABEL: { admin: "Admin", guru: "Guru", kepala: "Kepala Sekolah" },
}));

// Trend builder stub — avoids importing chart deps.
vi.mock("../../lib/akademikTrend", () => ({
  buildNilaiTrend: () => ({ points: [], labels: [] }),
}));

// @sekolahpro/ui stub — renders children; named exports are no-ops or pass-through.
vi.mock("@sekolahpro/ui", () => ({
  SectionCard: ({
    children,
    title,
    description,
  }: {
    children: ReactNode;
    title?: string;
    description?: string;
  }) => (
    <section>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </section>
  ),
  PageHeader: ({ title }: { title?: string }) => <header><h1>{title}</h1></header>,
  PageGuide: () => null,
  StatCard: () => null,
  AttentionList: () => null,
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
  ModuleFlow: () => null,
  GlossaryTooltip: ({ term }: { term: string }) => <span>{term}</span>,
  cn: (...c: string[]) => c.filter(Boolean).join(" "),
  IconBook: () => null,
  IconCheck: () => null,
  IconAlert: () => null,
  IconEdit: () => null,
  IconFile: () => null,
  IconGrad: () => null,
  IconSettings: () => null,
  IconChart: () => null,
  IconUsers: () => null,
}));

// viz components stub — not under test here.
vi.mock("../../components/viz", () => ({
  DonutChart: () => null,
  DistributionBar: () => null,
  HBarChart: () => null,
  ProgressRing: () => null,
  Sparkline: () => null,
}));

// guide stub
vi.mock("../../components/guide", () => ({
  PageGuide: () => null,
}));

// glossary stub
vi.mock("../../lib/glossary", () => ({ GLOSSARY: {} }));

function TestWrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function makeWrapper() {
  return TestWrapper;
}

describe("Dashboard workspace — Tautan Modul card", () => {
  afterEach(cleanup);

  it("renders 'Buka PPDB' link pointing at /akademik/ppdb", () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />, { wrapper: makeWrapper() });

    const link = screen.getByRole("link", { name: /Buka PPDB/i });
    expect(link).toBeTruthy();
    // href contains /akademik/ppdb after $sekolah substitution
    expect(link.getAttribute("href")).toContain("/akademik/ppdb");
  });

  it("renders 'Buka Absensi' link pointing at /absensi", () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />, { wrapper: makeWrapper() });

    const link = screen.getByRole("link", { name: /Buka Absensi/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toContain("/absensi");
  });

  it("renders 'Buka Laporan' link pointing at /laporan", () => {
    const Component = Route.component as React.ComponentType;
    render(<Component />, { wrapper: makeWrapper() });

    const link = screen.getByRole("link", { name: /Buka Laporan/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toContain("/laporan");
  });
});

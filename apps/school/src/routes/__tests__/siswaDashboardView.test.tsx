import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { SiswaDashboardView } from "../sch.$sekolah.siswa.index";

// Globals are disabled in vitest config, so cleanup is not auto-run between
// tests. Without it, each render leaks into the next test's DOM and getByText
// finds duplicate nodes.
afterEach(cleanup);
import {
  computeSiswaStats,
  statusDonut,
  genderSegments,
  deriveActionQueue,
  type SiswaRow,
} from "../../lib/orang/siswaStats";

// Plain anchor renderLink so the pure View needs no Router context in tests.
const renderLink = (href: string, children: ReactNode, className?: string): ReactNode => (
  <a href={href} className={className}>
    {children}
  </a>
);

// A representative dataset exercising every status / gender / jenjang bucket.
const SAMPLE_ROWS: SiswaRow[] = [
  { name: "S1", status: "Aktif", jenis_kelamin: "Laki-laki", jenjang: "SD", nama_lengkap: "Andi" },
  { name: "S2", status: "Aktif", jenis_kelamin: "Perempuan", jenjang: "SD", nama_lengkap: "Bunga" },
  { name: "S3", status: "Calon", jenis_kelamin: "Laki-laki", jenjang: "SMP", nama_lengkap: "Cahya" },
  { name: "S4", status: "Pindah Keluar", jenis_kelamin: "Perempuan", jenjang: "SMA", nama_lengkap: "Dewi" },
];

/** Build the full pure-prop bundle the View expects from a row set. */
function viewProps(rows: SiswaRow[]) {
  return {
    sekolah: "sekolah-demo",
    isLoading: false,
    isError: false,
    errorMessage: undefined,
    total: rows.length,
    stats: computeSiswaStats(rows),
    statusData: statusDonut(rows),
    genderData: genderSegments(rows),
    actionItems: deriveActionQueue(rows),
    renderLink,
  };
}

describe("SiswaDashboardView", () => {
  it("renders the dashboard heading and the KPI labels", () => {
    render(<SiswaDashboardView {...viewProps(SAMPLE_ROWS)} />);

    expect(screen.getByRole("heading", { name: /Dashboard Siswa/i })).toBeInTheDocument();
    expect(screen.getByText(/Total Siswa/i)).toBeInTheDocument();
    expect(screen.getByText(/Siswa Aktif/i)).toBeInTheDocument();
  });

  it("renders at least one accessible chart with role=img", () => {
    render(<SiswaDashboardView {...viewProps(SAMPLE_ROWS)} />);

    const charts = screen.getAllByRole("img");
    expect(charts.length).toBeGreaterThan(0);
    // The status donut summarises its data in the aria-label.
    expect(charts.some((c) => /Aktif/i.test(c.getAttribute("aria-label") ?? ""))).toBe(true);
  });

  it("shows the derived action-queue items from real counts", () => {
    render(<SiswaDashboardView {...viewProps(SAMPLE_ROWS)} />);

    // Calon (1) and Pindah Keluar (1) each emit one AttentionItem.
    expect(screen.getByText(/Calon siswa menunggu aktivasi/i)).toBeInTheDocument();
    expect(screen.getByText(/Mutasi keluar perlu difinalisasi/i)).toBeInTheDocument();
  });

  it("renders the onboarding empty state when there are zero rows", () => {
    render(<SiswaDashboardView {...viewProps([])} />);

    expect(screen.getByText(/Belum ada data siswa/i)).toBeInTheDocument();
    // KPI cards must not appear in the empty state.
    expect(screen.queryByText(/Total Siswa/i)).not.toBeInTheDocument();
  });
});

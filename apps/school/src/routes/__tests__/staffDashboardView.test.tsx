// RTL tests for the pure StaffDashboardView (no Router, no api hooks).
// Globals are disabled in vitest config, so vitest helpers are imported.
import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import type { ReactNode } from "react";

import {
  StaffDashboardView,
  type StaffDashboardData,
} from "../sch.$sekolah.staff.index";

afterEach(cleanup);

// A plain anchor render-link so the pure view needs no TanStack Router context.
function renderLink(href: string, children: ReactNode): ReactNode {
  return <a href={href}>{children}</a>;
}

// A populated, fully-aggregated dataset mirroring what StaffIndex() would pass.
function populatedData(): StaffDashboardData {
  return {
    counts: { total: 12, guru: 7, staff: 3, dual: 2, aktif: 10 },
    roleDonut: [
      { label: "Guru", value: 7, tone: "brand" },
      { label: "Staff", value: 3, tone: "violet" },
      { label: "Dual-role", value: 2, tone: "amber" },
    ],
    statusBars: [
      { label: "PNS", value: 4 },
      { label: "GTY", value: 5 },
      { label: "Honorer", value: 3 },
    ],
    sertifikasi: { certified: 6, total: 9, pct: 67 },
    genderSegments: [
      { label: "Laki-laki", value: 5, tone: "brand" },
      { label: "Perempuan", value: 7, tone: "rose" },
    ],
    actionQueue: [
      {
        id: "staff-nonaktif",
        tone: "warning",
        label: "Pegawai non-aktif perlu ditinjau",
        description: "Pastikan status & berkas mutasi/pensiun sudah lengkap",
        badge: "2",
        actionLabel: "Tinjau",
      },
      {
        id: "staff-belum-sertifikasi",
        tone: "info",
        label: "Guru belum sertifikasi",
        description: "Dorong pengajuan sertifikasi pendidik",
        badge: "3",
        actionLabel: "Lihat",
      },
    ],
  };
}

// An empty dataset: zero pegawai, every aggregate at its empty value.
function emptyData(): StaffDashboardData {
  return {
    counts: { total: 0, guru: 0, staff: 0, dual: 0, aktif: 0 },
    roleDonut: [],
    statusBars: [],
    sertifikasi: { certified: 0, total: 0, pct: 0 },
    genderSegments: [],
    actionQueue: [],
  };
}

describe("StaffDashboardView (populated)", () => {
  it("renders the five KPI StatCard labels", () => {
    render(<StaffDashboardView data={populatedData()} renderLink={renderLink} />);
    expect(screen.getByText("Total Pegawai")).toBeInTheDocument();
    expect(screen.getByText("Guru")).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("Dual-role")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
  });

  it("renders at least one accessible chart (role=img)", () => {
    render(<StaffDashboardView data={populatedData()} renderLink={renderLink} />);
    const charts = screen.getAllByRole("img");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("shows the sertifikasi coverage percentage from the ring", () => {
    render(<StaffDashboardView data={populatedData()} renderLink={renderLink} />);
    // ProgressRing renders the integer percent followed by a "%".
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("renders the Perlu Tindakan action-queue items", () => {
    render(<StaffDashboardView data={populatedData()} renderLink={renderLink} />);
    expect(
      screen.getByText("Pegawai non-aktif perlu ditinjau"),
    ).toBeInTheDocument();
    expect(screen.getByText("Guru belum sertifikasi")).toBeInTheDocument();
  });

  it("renders the staff setup ModuleFlow steps", () => {
    render(<StaffDashboardView data={populatedData()} renderLink={renderLink} />);
    expect(screen.getByText("Daftar Pegawai")).toBeInTheDocument();
    expect(screen.getByText("Jabatan")).toBeInTheDocument();
  });
});

describe("StaffDashboardView (empty)", () => {
  it("renders the getting-started onboarding card when there are no pegawai", () => {
    render(<StaffDashboardView data={emptyData()} renderLink={renderLink} />);
    expect(screen.getByText("Belum ada data pegawai")).toBeInTheDocument();
  });

  it("does not throw and shows no action-queue rows when empty", () => {
    render(<StaffDashboardView data={emptyData()} renderLink={renderLink} />);
    expect(
      screen.queryByText("Pegawai non-aktif perlu ditinjau"),
    ).not.toBeInTheDocument();
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PusatLaporHero } from "../PusatLaporHero";

afterEach(cleanup);

describe("PusatLaporHero", () => {
  it("renders the TU obligations with their target", () => {
    render(<PusatLaporHero now={new Date("2026-06-10T00:00:00")} />);
    expect(screen.getByText("Pelaporan Dapodik Bulanan")).toBeTruthy();
    expect(screen.getByText("Laporan TPG (Tunjangan Profesi Guru)")).toBeTruthy();
  });

  it("surfaces overdue obligations (Bulanan due-day 5 is past on the 10th)", () => {
    render(<PusatLaporHero now={new Date("2026-06-10T00:00:00")} />);
    expect(screen.getAllByText("Terlambat").length).toBeGreaterThan(0);
  });

  it("flags Dinas-channel member reports as runnable, not dead", () => {
    render(<PusatLaporHero now={new Date("2026-06-10T00:00:00")} />);
    // Data Siswa Dapodik is in the Dinas channel → labelled "Dinas"
    expect(screen.getAllByText("Dinas").length).toBeGreaterThan(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KalenderWajibLapor } from "../KalenderWajibLapor";

afterEach(cleanup);

describe("KalenderWajibLapor", () => {
  it("shows this month's monthly obligations with their due day", () => {
    render(<KalenderWajibLapor now={new Date("2026-06-10T00:00:00")} />);
    expect(screen.getByText("Pelaporan Dapodik Bulanan")).toBeTruthy();
    // Dapodik + Absensi are due on the 5th
    expect(screen.getAllByText("Tgl 5").length).toBeGreaterThan(0);
  });
});

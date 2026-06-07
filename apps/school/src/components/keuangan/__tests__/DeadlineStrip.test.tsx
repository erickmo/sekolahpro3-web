import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import { DeadlineStrip } from "../DeadlineStrip";
import type { Deadline } from "../../../lib/keuanganCalendar";

afterEach(cleanup);

const ppn: Deadline = {
  id: "ppn-masa",
  title: "Lapor SPT Masa PPN",
  dueDate: "2026-06-15",
  daysLeft: 5,
  severity: "amber",
  to: "/sch/$sekolah/akuntansi/pajak/spt-ppn",
};

describe("DeadlineStrip", () => {
  it("renders a chip with countdown for a pressing deadline", () => {
    render(<DeadlineStrip deadlines={[ppn]} sekolah="x" />);
    expect(screen.getByText("Lapor SPT Masa PPN")).toBeTruthy();
    expect(screen.getByText("H-5")).toBeTruthy();
  });

  it("collapses to nothing when no deadline is within range", () => {
    const far: Deadline = { ...ppn, id: "far", daysLeft: 40 };
    const { container } = render(<DeadlineStrip deadlines={[far]} sekolah="x" withinDays={14} />);
    expect(container.firstChild).toBeNull();
  });

  it("collapses to nothing when there are no deadlines", () => {
    const { container } = render(<DeadlineStrip deadlines={[]} sekolah="x" />);
    expect(container.firstChild).toBeNull();
  });
});

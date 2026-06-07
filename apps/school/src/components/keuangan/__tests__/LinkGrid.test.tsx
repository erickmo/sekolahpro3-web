import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// TanStack Link needs no router context in tests; render as a plain anchor.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import { LinkGrid, type QuickLink } from "../LinkGrid";

afterEach(cleanup);

const ITEMS: QuickLink[] = [
  { to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", label: "SPT Masa PPN", hint: "Pelaporan PPN" },
  { to: "/sch/$sekolah/akuntansi/anggaran", label: "Anggaran", hint: "Budget" },
];

describe("LinkGrid", () => {
  it("renders one tile per item with label + hint", () => {
    render(<LinkGrid items={ITEMS} sekolah="x" />);
    expect(screen.getByText("SPT Masa PPN")).toBeTruthy();
    expect(screen.getByText("Pelaporan PPN")).toBeTruthy();
    expect(screen.getByText("Anggaran")).toBeTruthy();
  });

  it("builds scoped hrefs from bare routes", () => {
    render(<LinkGrid items={ITEMS} sekolah="x" />);
    const link = screen.getByText("SPT Masa PPN").closest("a");
    expect(link?.getAttribute("href")).toBe("/sch/$sekolah/akuntansi/pajak/spt-ppn");
  });
});

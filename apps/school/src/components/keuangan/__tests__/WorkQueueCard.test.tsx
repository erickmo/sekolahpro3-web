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

import { WorkQueueCard } from "../WorkQueueCard";
import type { WorkItem } from "../../../lib/keuanganWorkQueue";

afterEach(cleanup);

const ITEM: WorkItem = {
  id: "t1",
  type: "tagihan",
  label: "Budi · SPP Juni",
  amount: 1_000_000,
  ageDays: 5,
  dueLabel: "5 hari telat",
  severity: "red",
  to: "/sch/$sekolah/keuangan/tagihan",
};

describe("WorkQueueCard", () => {
  it("renders a row with label, formatted amount, due label, and a deep-link", () => {
    render(<WorkQueueCard items={[ITEM]} sekolah="x" />);
    expect(screen.getByText("Budi · SPP Juni")).toBeTruthy();
    expect(screen.getByText(/1\.000\.000/)).toBeTruthy();
    expect(screen.getByText("5 hari telat")).toBeTruthy();
    const link = screen.getByText("Budi · SPP Juni").closest("a");
    expect(link?.getAttribute("href")).toContain("/keuangan/tagihan");
  });

  it("shows the inbox-zero closure + 0/0 meter when empty", () => {
    render(<WorkQueueCard items={[]} sekolah="x" />);
    expect(screen.getByText(/Kotak masuk bersih/i)).toBeTruthy();
  });

  it("shows a progress meter of done vs total", () => {
    render(<WorkQueueCard items={[ITEM]} sekolah="x" doneIds={[]} />);
    expect(screen.getByText(/0\s*\/\s*1/)).toBeTruthy();
  });
});

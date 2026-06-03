import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";

// ModuleShell renders GroupedNavTabs, which uses TanStack <Link>; stub it to a
// plain anchor so the test needs no router context.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import { ModuleShell } from "../ModuleShell";
import type { NavTabGroup } from "../../GroupedNavTabs";

afterEach(cleanup);

const NAV: NavTabGroup[] = [
  { label: "Ringkasan", items: [{ to: "/sch/x/jadwal", label: "Dashboard", exact: true }] },
  { label: "Kelola", items: [{ to: "/sch/x/jadwal/slot", label: "Slot Jadwal" }] },
];

describe("ModuleShell", () => {
  it("renders the sub-nav tabs from navGroups and the page body", () => {
    render(
      <ModuleShell navGroups={NAV} pathname="/sch/x/jadwal">
        <div>page body</div>
      </ModuleShell>,
    );
    expect(screen.getByRole("link", { name: "Slot Jadwal" })).toBeInTheDocument();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("renders the default context bar when a label is provided", () => {
    render(<ModuleShell label="Jadwal" navGroups={NAV} pathname="/sch/x/jadwal" />);
    expect(screen.getByText("Konteks Jadwal")).toBeInTheDocument();
  });

  it("omits the context row entirely when no label/context is given", () => {
    render(<ModuleShell navGroups={NAV} pathname="/sch/x/jadwal" />);
    expect(screen.queryByText(/^Konteks /)).toBeNull();
  });

  it("uses a custom context node (e.g. a period bar) when provided", () => {
    render(
      <ModuleShell context={<div>PERIOD BAR</div>} navGroups={NAV} pathname="/sch/x/jadwal" />,
    );
    expect(screen.getByText("PERIOD BAR")).toBeInTheDocument();
  });
});

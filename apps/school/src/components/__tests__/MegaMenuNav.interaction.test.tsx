import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { MegaMenuNav } from "../MegaMenuNav";
import type { NavTabGroup } from "../GroupedNavTabs";

// MegaMenuNav renders TanStack <Link>; stub it to a plain anchor so the test
// needs no router context and stays focused on the dropdown behaviour.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    onClick,
    className,
  }: {
    to: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

const GROUPS: NavTabGroup[] = [
  {
    label: "Umum",
    items: [{ to: "/sch/x/master", label: "Dashboard", exact: true }],
  },
  {
    label: "Akademik",
    items: [{ to: "/sch/x/master/tahun-ajaran", label: "Tahun Ajaran" }],
  },
];

// globals:false in vitest.config means afterEach(cleanup) is NOT auto-wired;
// register it so each test starts with a fresh DOM (no element leakage).
afterEach(cleanup);

describe("MegaMenuNav interaction", () => {
  it("panel hidden until trigger clicked", () => {
    render(
      <MegaMenuNav
        groups={GROUPS}
        pathname="/sch/x/siswa"
        triggerLabel="Master Data"
      />,
    );
    expect(screen.queryByText("Akademik")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /master data/i }));
    // Group labels + item links appear once open.
    expect(screen.getByText("Akademik")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tahun Ajaran" }),
    ).toBeInTheDocument();
  });

  it("trigger label reflects active item", () => {
    render(
      <MegaMenuNav
        groups={GROUPS}
        pathname="/sch/x/master/tahun-ajaran/SMP-2026"
      />,
    );
    // Active leaf wins over default label even before opening.
    expect(
      screen.getByRole("button", { name: /tahun ajaran/i }),
    ).toBeInTheDocument();
  });

  it("selecting an item closes the panel", () => {
    render(
      <MegaMenuNav
        groups={GROUPS}
        pathname="/sch/x/siswa"
        triggerLabel="Master Data"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /master data/i }));
    fireEvent.click(screen.getByRole("link", { name: "Tahun Ajaran" }));
    expect(screen.queryByText("Akademik")).toBeNull();
  });

  it("Escape closes the panel", () => {
    render(
      <MegaMenuNav
        groups={GROUPS}
        pathname="/sch/x/siswa"
        triggerLabel="Master Data"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /master data/i }));
    expect(screen.getByText("Akademik")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Akademik")).toBeNull();
  });

  it("outside click closes the panel", () => {
    render(
      <MegaMenuNav
        groups={GROUPS}
        pathname="/sch/x/siswa"
        triggerLabel="Master Data"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /master data/i }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Akademik")).toBeNull();
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createRootRoute, createRouter, RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { GroupedNavTabs, type NavTabGroup } from "./GroupedNavTabs";

const GROUPS: NavTabGroup[] = [
  { label: "Ringkasan", items: [{ to: "/x", label: "Dashboard", exact: true }] },
  { label: "Kelola", items: [{ to: "/x/program", label: "Program" }] },
];

// GroupedNavTabs renders <Link>, so it needs a router context to mount.
function renderInRouter(node: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{node}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/x"] }),
  });
  return render(<RouterProvider router={router as never} />);
}

describe("GroupedNavTabs variants", () => {
  afterEach(() => cleanup());

  it("'inline' wraps pills in a rounded, bordered container", async () => {
    renderInRouter(<GroupedNavTabs groups={GROUPS} pathname="/x" variant="inline" />);
    // RouterProvider mounts async; wait for a pill, then read its <nav> ancestor.
    const nav = (await screen.findByText("Dashboard")).closest("nav") as HTMLElement;
    expect(nav.className).toContain("rounded-xl");
    expect(nav.className).toContain("border");
  });

  it("'header' drops the border/rounded chrome so it sits flush in a panel", async () => {
    renderInRouter(<GroupedNavTabs groups={GROUPS} pathname="/x" variant="header" />);
    const nav = (await screen.findByText("Dashboard")).closest("nav") as HTMLElement;
    expect(nav.className).not.toContain("rounded-xl");
    expect(nav.className).not.toContain("border");
    // Pills themselves still render.
    expect(screen.getByText("Program")).toBeTruthy();
  });
});

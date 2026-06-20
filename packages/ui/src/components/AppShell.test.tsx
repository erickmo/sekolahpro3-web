import { describe, it, expect } from "vitest";
import { act } from "react";
import { render, fireEvent } from "@testing-library/react";
import { AppShell } from "./AppShell";

function renderShell() {
  return render(
    <AppShell brand={<span>Brand</span>} sidebar={<nav>side</nav>} topbar={<div>top</div>}>
      <div>page</div>
    </AppShell>,
  );
}

// Regression: a module page with very wide content (e.g. the Keuangan hub's long
// sub-nav + charts) must NOT push the whole viewport into horizontal scroll.
//
// Root cause guarded here: the content region is the `1fr` column of a CSS grid.
// A bare `1fr` track resolves to `minmax(auto, 1fr)`, whose AUTO minimum is the
// content's min-content size — so an unshrinkable child expands the track past
// the viewport (verified: Keuangan main blew to 2704px in a 1280px window).
// The track must be `minmax(0, 1fr)` AND `<main>` must carry `min-w-0` so the
// column is authoritative and overflowing content scrolls/wraps locally instead.
describe("AppShell content-column overflow guard", () => {
  it("caps the content grid track at minmax(0, 1fr), not a bare 1fr", () => {
    const { container } = renderShell();
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-[260px_minmax(0,1fr)]");
    expect(grid.className).not.toMatch(/(^|\s)grid-cols-\[260px_1fr\]/);
  });

  it("gives <main> min-w-0 so wide children cannot blow out the column", () => {
    const { container } = renderShell();
    const main = container.querySelector("main") as HTMLElement;
    expect(main.className.split(/\s+/)).toContain("min-w-0");
  });
});

// Below lg the fixed 260px rail would crowd a narrow viewport and overflow the
// topbar, so the sidebar becomes an off-canvas drawer toggled from the header.
// The rail (lg+) must stay untouched: every drawer-only affordance is `lg:hidden`
// and the rail keeps `lg:static lg:translate-x-0`.
describe("AppShell responsive sidebar drawer", () => {
  const aside = (c: HTMLElement) => c.querySelector("aside") as HTMLElement;
  const backdrop = (c: HTMLElement) => c.querySelector("div.fixed.inset-0.z-40");

  it("renders a lg:hidden hamburger toggle and starts closed", () => {
    const { container, getByLabelText } = renderShell();
    const burger = getByLabelText("Buka menu navigasi");
    expect(burger.className).toContain("lg:hidden");
    expect(burger.getAttribute("aria-expanded")).toBe("false");
    expect(aside(container).className).toContain("-translate-x-full");
    expect(backdrop(container)).toBeNull();
  });

  it("keeps the rail visible at lg+ regardless of open state", () => {
    const { container } = renderShell();
    // The rail re-enters flow and is always on-screen at lg+.
    expect(aside(container).className).toContain("lg:static");
    expect(aside(container).className).toContain("lg:translate-x-0");
  });

  it("opens on hamburger click (slides in + shows backdrop)", () => {
    const { container, getByLabelText } = renderShell();
    fireEvent.click(getByLabelText("Buka menu navigasi"));
    expect(aside(container).className).toContain("translate-x-0");
    expect(aside(container).className).not.toContain("-translate-x-full");
    expect(backdrop(container)).not.toBeNull();
  });

  it("closes when the backdrop is clicked", () => {
    const { container, getByLabelText } = renderShell();
    fireEvent.click(getByLabelText("Buka menu navigasi"));
    fireEvent.click(backdrop(container) as Element);
    expect(aside(container).className).toContain("-translate-x-full");
    expect(backdrop(container)).toBeNull();
  });

  it("closes on Escape", () => {
    const { container, getByLabelText } = renderShell();
    fireEvent.click(getByLabelText("Buka menu navigasi"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(aside(container).className).toContain("-translate-x-full");
  });

  it("closes when a nav link inside the drawer is clicked", () => {
    const { container, getByLabelText, getByText } = render(
      <AppShell brand={<span>Brand</span>} sidebar={<a href="#x">Dashboard</a>} topbar={<div>top</div>}>
        <div>page</div>
      </AppShell>,
    );
    fireEvent.click(getByLabelText("Buka menu navigasi"));
    expect(aside(container).className).toContain("translate-x-0");
    fireEvent.click(getByText("Dashboard"));
    expect(aside(container).className).toContain("-translate-x-full");
  });
});

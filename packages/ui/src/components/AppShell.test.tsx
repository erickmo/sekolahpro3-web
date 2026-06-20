import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppShell } from "./AppShell";

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
  function renderShell() {
    return render(
      <AppShell sidebar={<nav>side</nav>} topbar={<div>top</div>}>
        <div>page</div>
      </AppShell>,
    );
  }

  it("caps the content grid track at minmax(0, 1fr), not a bare 1fr", () => {
    const { container } = renderShell();
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-[260px_minmax(0,1fr)]");
    expect(grid.className).not.toMatch(/grid-cols-\[260px_1fr\]/);
  });

  it("gives <main> min-w-0 so wide children cannot blow out the column", () => {
    const { container } = renderShell();
    const main = container.querySelector("main") as HTMLElement;
    expect(main.className.split(/\s+/)).toContain("min-w-0");
  });
});

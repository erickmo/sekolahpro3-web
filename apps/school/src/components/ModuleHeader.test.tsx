import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ModuleHeader } from "./ModuleHeader";
import { SetupBannerContext } from "../lib/setupBanner";

describe("ModuleHeader", () => {
  afterEach(() => cleanup());

  it("renders both the context slot and the nav slot", () => {
    render(<ModuleHeader context={<span>Konteks X</span>} nav={<span>Nav Y</span>} />);
    expect(screen.getByText("Konteks X")).toBeTruthy();
    expect(screen.getByText("Nav Y")).toBeTruthy();
  });

  it("is a sticky, full-bleed panel so context + nav pin together on scroll", () => {
    const { container } = render(<ModuleHeader context={<span>c</span>} nav={<span>n</span>} />);
    const panel = container.firstElementChild as HTMLElement;
    // Sticky + negative inset (full-bleed) are what make it one cohesive header.
    expect(panel.className).toContain("sticky");
    expect(panel.className).toContain("-mx-4");
    // Negative top margin cancels <main> padding so there is no gap above it.
    expect(panel.className).toContain("-mt-6");
    expect(panel.className).toContain("border-b");
  });

  it("drops the top bleed when the global setup banner is active", () => {
    const { container } = render(
      <SetupBannerContext.Provider value={true}>
        <ModuleHeader context={<span>c</span>} nav={<span>n</span>} />
      </SetupBannerContext.Provider>,
    );
    const panel = container.firstElementChild as HTMLElement;
    // No negative top margin → header won't pull up over the banner.
    expect(panel.className).not.toContain("-mt-6");
    expect(panel.className).not.toContain("-mt-8");
    // Horizontal bleed + sticky stay.
    expect(panel.className).toContain("sticky");
    expect(panel.className).toContain("-mx-4");
  });

  it("places a divider between the context row and the nav row", () => {
    const { container } = render(<ModuleHeader context={<span>c</span>} nav={<span>n</span>} />);
    // The first inner wrapper carries the hairline that separates the two rows.
    const contextWrap = container.querySelector("div > div");
    expect(contextWrap?.className).toContain("border-b");
  });
});

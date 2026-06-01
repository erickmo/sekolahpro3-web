/**
 * Regression test for the PageGuide guide card.
 *
 * Guards two bugs found during the AuditFix phase:
 *   1. Giant icon — the IconBook rendered with no Tailwind size class, so it
 *      blew up to its intrinsic size. The fix adds `h-4 w-4` to the icon.
 *   2. Non-collapsible — the toggle button must actually hide/show the steps.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PageGuide } from "./PageGuide";

const STEP_TEXT = "Langkah satu";

beforeEach(() => {
  localStorage.clear();
});

// Unmount the previous render so screen queries don't see stale DOM from the
// earlier test (otherwise getByText finds the step twice).
afterEach(() => cleanup());

describe("PageGuide", () => {
  it("renders a sized IconBook on the toggle button (catches giant-icon bug)", () => {
    render(
      <PageGuide
        storageId="test-guide-icon"
        steps={[{ title: STEP_TEXT }]}
        tips={["tip"]}
      />,
    );

    const toggle = screen.getByRole("button");
    const icon = toggle.querySelector("svg");
    expect(icon).not.toBeNull();

    // The icon must carry a Tailwind size token (e.g. h-4 / w-4). Without a
    // size class the icon renders at its intrinsic (giant) size.
    const className = icon?.getAttribute("class") ?? "";
    expect(className).toMatch(/\b[hw]-\d/);
  });

  it("collapses and expands the steps when the toggle is clicked", () => {
    render(
      <PageGuide
        storageId="test-guide-collapse"
        steps={[{ title: STEP_TEXT }]}
        tips={["tip"]}
      />,
    );

    // Open by default: the step text is visible.
    expect(screen.getByText(STEP_TEXT)).toBeInTheDocument();

    const toggle = screen.getByRole("button");

    // First click collapses: the step text disappears.
    fireEvent.click(toggle);
    expect(screen.queryByText(STEP_TEXT)).toBeNull();

    // Second click expands: the step text comes back.
    fireEvent.click(toggle);
    expect(screen.getByText(STEP_TEXT)).toBeInTheDocument();
  });
});

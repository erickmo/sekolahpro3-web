/**
 * Unit tests for the core viz primitives consumed by the akademik module.
 *
 * Covers AKA-29: ProgressRing value clamping + label, and DistributionBar
 * proportional summary / empty-state rendering. These are presentational, so we
 * assert the accessible output (text + aria-label) rather than SVG geometry.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ProgressRing, DistributionBar, type DistributionSegment } from "./charts";

afterEach(() => cleanup());

describe("ProgressRing", () => {
  it("renders the rounded percentage", () => {
    render(<ProgressRing value={42} />);
    expect(screen.getByText("42%")).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Lingkaran progres 42 persen");
  });

  it("clamps values above 100", () => {
    render(<ProgressRing value={150} />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("clamps negative values to 0", () => {
    render(<ProgressRing value={-10} />);
    expect(screen.getByText("0%")).toBeTruthy();
  });
});

describe("DistributionBar", () => {
  const segments: DistributionSegment[] = [
    { label: "A", value: 3, tone: "emerald" },
    { label: "B", value: 1, tone: "sky" },
  ];

  it("summarises segments with value and percent in its aria-label", () => {
    render(<DistributionBar segments={segments} />);
    const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
    expect(label).toContain("Distribusi.");
    expect(label).toContain("A: 3 (75%)");
    expect(label).toContain("B: 1 (25%)");
  });

  it("renders an empty state when every segment is zero", () => {
    render(<DistributionBar segments={[{ label: "A", value: 0, tone: "emerald" }]} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Distribusi tanpa data");
  });
});

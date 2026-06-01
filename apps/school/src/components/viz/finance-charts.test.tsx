import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  buildLinePath,
  stackFractions,
  waterfallLayout,
  LineChart,
  GaugeChart,
  WaterfallChart,
  StackedBarChart,
} from "./finance-charts";

afterEach(cleanup);

describe("buildLinePath", () => {
  it("maps points to an SVG polyline path (y inverted)", () => {
    expect(buildLinePath([0, 5, 10], { width: 100, height: 50, max: 10, min: 0 })).toBe(
      "M 0 50 L 50 25 L 100 0",
    );
  });

  it("returns empty string for fewer than two points", () => {
    expect(buildLinePath([], { width: 100, height: 50, max: 10 })).toBe("");
    expect(buildLinePath([3], { width: 100, height: 50, max: 10 })).toBe("");
  });

  it("does not divide by zero when max equals min", () => {
    expect(() => buildLinePath([5, 5], { width: 100, height: 50, max: 5, min: 5 })).not.toThrow();
  });
});

describe("stackFractions", () => {
  it("returns cumulative offset + fraction per segment", () => {
    expect(stackFractions([1, 3])).toEqual([
      { offset: 0, fraction: 0.25 },
      { offset: 0.25, fraction: 0.75 },
    ]);
  });

  it("returns all-zero fractions for an empty/zero total", () => {
    expect(stackFractions([0, 0])).toEqual([
      { offset: 0, fraction: 0 },
      { offset: 0, fraction: 0 },
    ]);
  });
});

describe("waterfallLayout", () => {
  it("computes base/top/balance for each running step", () => {
    expect(waterfallLayout(100, [50, -30])).toEqual([
      { base: 100, top: 150, delta: 50, balance: 150 },
      { base: 120, top: 150, delta: -30, balance: 120 },
    ]);
  });
});

describe("finance chart components (smoke)", () => {
  it("LineChart renders an accessible figure and a path per series", () => {
    const { container } = render(
      <LineChart
        series={[
          { label: "Masuk", tone: "emerald", points: [1, 2, 3] },
          { label: "Keluar", tone: "rose", points: [3, 2, 1] },
        ]}
        ariaLabel="Tren kas"
      />,
    );
    expect(screen.getByRole("img", { name: /tren kas/i })).toBeTruthy();
    expect(container.querySelectorAll("path.line-series").length).toBe(2);
  });

  it("GaugeChart renders and clamps out-of-range values without throwing", () => {
    expect(() => render(<GaugeChart value={140} label="serapan" ariaLabel="Serapan anggaran" />)).not.toThrow();
    expect(screen.getByRole("img", { name: /serapan anggaran/i })).toBeTruthy();
  });

  it("WaterfallChart renders a bar per step", () => {
    const { container } = render(
      <WaterfallChart start={100} steps={[{ label: "Masuk", delta: 50 }, { label: "Keluar", delta: -30 }]} ariaLabel="Arus kas" />,
    );
    expect(container.querySelectorAll("rect.waterfall-bar").length).toBe(2);
  });

  it("StackedBarChart renders without throwing on empty data", () => {
    expect(() => render(<StackedBarChart groups={[]} ariaLabel="kosong" />)).not.toThrow();
  });
});

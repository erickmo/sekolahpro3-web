import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SummaryStrip } from "./SummaryStrip";
import type { SummaryItem } from "../lib/orang/listSummary";

// globals:false → no automatic cleanup; unmount between tests to avoid leaks.
afterEach(() => cleanup());

const items: SummaryItem[] = [
  { label: "Aktif", value: 12, tone: "emerald" },
  { label: "Calon", value: 3, tone: "amber" },
  { label: "Lainnya", value: 5, tone: "neutral" },
];

describe("SummaryStrip", () => {
  it("renders one card per item with its label and value", () => {
    render(<SummaryStrip items={items} />);
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Calon")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Lainnya")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders nothing for an empty items array", () => {
    const { container } = render(<SummaryStrip items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a hint when one is supplied", () => {
    render(<SummaryStrip items={[{ label: "Total", value: 9, hint: "semua siswa" }]} />);
    expect(screen.getByText("semua siswa")).toBeInTheDocument();
  });
});

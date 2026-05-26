import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonText } from "../src/primitives/skeleton";

describe("Skeleton", () => {
  it("renders with accessible role status by default", () => {
    render(<Skeleton aria-label="Memuat data" />);
    const el = screen.getByRole("status", { name: "Memuat data" });
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/animate-pulse/);
  });

  it("applies width and height styles", () => {
    const { container } = render(<Skeleton className="h-10 w-40" aria-label="x" />);
    expect(container.firstChild).toHaveClass("h-10");
    expect(container.firstChild).toHaveClass("w-40");
  });
});

describe("SkeletonText", () => {
  it("renders N lines", () => {
    const { container } = render(<SkeletonText lines={4} aria-label="Memuat teks" />);
    const lines = container.querySelectorAll("[data-skeleton-line]");
    expect(lines).toHaveLength(4);
  });

  it("defaults to 3 lines", () => {
    const { container } = render(<SkeletonText aria-label="Memuat teks" />);
    expect(container.querySelectorAll("[data-skeleton-line]")).toHaveLength(3);
  });
});

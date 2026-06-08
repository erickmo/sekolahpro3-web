import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DefectGate } from "../DefectGate";

afterEach(cleanup);

describe("DefectGate", () => {
  it("shows a ready state when there are zero defects", () => {
    render(<DefectGate defectCount={0} />);
    expect(screen.getByText(/siap/i)).toBeTruthy();
  });

  it("shows the count and a not-ready message when defects remain", () => {
    render(<DefectGate defectCount={3} />);
    expect(screen.getByText(/3/)).toBeTruthy();
    expect(screen.getByText(/perlu/i)).toBeTruthy();
  });
});

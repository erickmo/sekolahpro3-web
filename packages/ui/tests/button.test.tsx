import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../src/primitives/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("applies destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const el = screen.getByRole("button", { name: "Delete" });
    expect(el.className).toMatch(/bg-danger/);
  });
});

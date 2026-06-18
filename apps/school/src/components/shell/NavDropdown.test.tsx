import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NavDropdown } from "./NavDropdown";

afterEach(cleanup);

describe("NavDropdown", () => {
  it("toggles the menu on trigger click", () => {
    render(
      <NavDropdown label="Kelas" active={false} pathname="/a">
        <li>Item</li>
      </NavDropdown>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Kelas" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("Item")).toBeTruthy();
  });

  it("closes on Escape", () => {
    render(
      <NavDropdown label="Jadwal" active pathname="/a">
        <li>X</li>
      </NavDropdown>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Jadwal" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("active trigger uses brand styling + aria-expanded tracks open state", () => {
    render(
      <NavDropdown label="PPDB" active pathname="/a">
        <li>X</li>
      </NavDropdown>,
    );
    const btn = screen.getByRole("button", { name: "PPDB" });
    expect(btn.className).toContain("bg-brand");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});

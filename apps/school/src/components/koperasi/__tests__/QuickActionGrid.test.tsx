import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { QuickActionGrid, QUICK_ACTIONS } from "../QuickActionGrid";

afterEach(() => cleanup());

describe("QuickActionGrid a11y", () => {
  it("renders one button per action with aria-keyshortcuts", () => {
    const onSelect = vi.fn();
    const { getAllByRole } = render(<QuickActionGrid onSelect={onSelect} />);
    const btns = getAllByRole("button");
    expect(btns).toHaveLength(QUICK_ACTIONS.length);
    QUICK_ACTIONS.forEach((a, i) => {
      expect(btns[i]?.getAttribute("aria-keyshortcuts")).toBe(a.hotkey);
      expect(btns[i]?.getAttribute("aria-label")).toContain(a.hotkey);
    });
  });

  it("invokes onSelect with action when clicked", () => {
    const onSelect = vi.fn();
    const { getAllByRole } = render(<QuickActionGrid onSelect={onSelect} />);
    fireEvent.click(getAllByRole("button")[0]!);
    expect(onSelect).toHaveBeenCalledWith(QUICK_ACTIONS[0]);
  });

  it("disables all buttons when disabled prop set", () => {
    const onSelect = vi.fn();
    const { getAllByRole } = render(<QuickActionGrid disabled onSelect={onSelect} />);
    for (const b of getAllByRole("button")) {
      expect(b).toBeDisabled();
    }
  });
});

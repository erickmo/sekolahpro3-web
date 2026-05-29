import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickAmountPad } from "../QuickAmountPad";

describe("QuickAmountPad", () => {
  it("fires onConfirm with amount", () => {
    const onConfirm = vi.fn();
    render(<QuickAmountPad onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: /konfirmasi/i }));
    expect(onConfirm).toHaveBeenCalledWith(10000);
  });
});

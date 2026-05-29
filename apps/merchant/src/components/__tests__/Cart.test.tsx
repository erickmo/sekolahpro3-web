import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Cart } from "../Cart";

const items = [
  { name: "I-001", nama: "Nasi", harga: 15000 },
  { name: "I-002", nama: "Es Teh", harga: 5000 },
];

describe("Cart", () => {
  it("computes total", () => {
    render(<Cart lines={[{ item: items[0], qty: 2 }, { item: items[1], qty: 1 }]} onChangeQty={() => {}} onRemove={() => {}} onTap={() => {}} disabled={false} />);
    expect(screen.getByTestId("cart-total").textContent).toContain("35.000");
  });

  it("disables tap when empty", () => {
    render(<Cart lines={[]} onChangeQty={() => {}} onRemove={() => {}} onTap={() => {}} disabled={false} />);
    expect(screen.getByRole("button", { name: /tap kartu/i })).toBeDisabled();
  });

  it("fires onTap when clicked", () => {
    const onTap = vi.fn();
    render(<Cart lines={[{ item: items[0], qty: 1 }]} onChangeQty={() => {}} onRemove={() => {}} onTap={onTap} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /tap kartu/i }));
    expect(onTap).toHaveBeenCalledOnce();
  });
});

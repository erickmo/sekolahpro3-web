import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogGrid } from "../CatalogGrid";

const items = [
  { name: "I-001", nama: "Nasi", harga: 15000, kategori_item: "MAKAN", aktif: true, track_stok: false, stok_qty: null },
  { name: "I-002", nama: "Es Teh", harga: 5000, kategori_item: "MINUM", aktif: true, track_stok: true, stok_qty: 0 },
];

describe("CatalogGrid", () => {
  it("renders items + filters by kategori", () => {
    render(<CatalogGrid items={items} onAdd={() => {}} kategoriFilter="MAKAN" onKategoriChange={() => {}} />);
    expect(screen.getByText("Nasi")).toBeInTheDocument();
    expect(screen.queryByText("Es Teh")).not.toBeInTheDocument();
  });

  it("disables add when stok 0", () => {
    render(<CatalogGrid items={items} onAdd={() => {}} kategoriFilter="ALL" onKategoriChange={() => {}} />);
    expect(screen.getByRole("button", { name: /es teh/i })).toBeDisabled();
  });

  it("fires onAdd", () => {
    const onAdd = vi.fn();
    render(<CatalogGrid items={items} onAdd={onAdd} kategoriFilter="ALL" onKategoriChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /nasi/i }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: "I-001" }));
  });
});

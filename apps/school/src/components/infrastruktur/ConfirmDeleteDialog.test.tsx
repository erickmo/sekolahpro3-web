import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  afterEach(() => cleanup());
  it("tombol Hapus memanggil onConfirm", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteDialog open label="Lantai GA-L1" onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("menampilkan error bila ada", () => {
    render(<ConfirmDeleteDialog open label="X" error="masih ada data turunan" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText("masih ada data turunan")).toBeTruthy();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IdScanField } from "../src/components/IdScanField";

beforeEach(() => {
  // jsdom lacks createImageBitmap + canvas context; stub downscale path
  global.createImageBitmap = vi.fn().mockResolvedValue({ width: 800, height: 500 });
  // @ts-expect-error — stub returns minimal ctx; full CanvasRenderingContext2D not needed
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) =>
    cb(new Blob([new Uint8Array([9])], { type: "image/jpeg" })),
  );
});

describe("IdScanField", () => {
  it("disables scan until consent is checked", () => {
    render(<IdScanField jenis="KTP" onScan={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByRole("button", { name: /pilih file/i })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/setuju/i));
    expect(screen.getByRole("button", { name: /pilih file/i })).not.toBeDisabled();
  });

  it("calls onScan then shows fields and applies them", async () => {
    const onScan = vi
      .fn()
      .mockResolvedValue({ nik: "3171234567890123", nama: "BUDI" });
    const onApply = vi.fn();
    render(<IdScanField jenis="KTP" onScan={onScan} onApply={onApply} />);
    fireEvent.click(screen.getByLabelText(/setuju/i));
    const file = new File([new Uint8Array([1, 2, 3])], "ktp.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("id-scan-file"), { target: { files: [file] } });
    await waitFor(() => expect(onScan).toHaveBeenCalled());
    await screen.findByText(/3171234567890123/);
    fireEvent.click(screen.getByRole("button", { name: /terapkan/i }));
    expect(onApply).toHaveBeenCalledWith({ nik: "3171234567890123", nama: "BUDI" });
  });
});

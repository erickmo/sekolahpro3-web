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

  it("calls onScan then shows fields, confidence badge, and applies them", async () => {
    const onScan = vi
      .fn()
      .mockResolvedValue({ fields: { nik: "3171234567890123", nama: "BUDI" }, confidence: 87 });
    const onApply = vi.fn();
    render(<IdScanField jenis="KTP" onScan={onScan} onApply={onApply} />);
    fireEvent.click(screen.getByLabelText(/setuju/i));
    const file = new File([new Uint8Array([1, 2, 3])], "ktp.png", { type: "image/png" });
    // FIX C1 compatibility: use the file-picker input (no capture)
    fireEvent.change(screen.getByTestId("id-scan-file"), { target: { files: [file] } });
    await waitFor(() => expect(onScan).toHaveBeenCalled());
    await screen.findByText(/3171234567890123/);
    // Confidence badge should appear
    expect(screen.getByText(/Keyakinan OCR/i)).toBeTruthy();
    expect(screen.getByText(/87%/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /terapkan/i }));
    // onApply receives only fields (not the full ScanOutcome)
    expect(onApply).toHaveBeenCalledWith({ nik: "3171234567890123", nama: "BUDI" });
  });

  // FIX M5: test the error path
  it("shows an error when onScan fails", async () => {
    const onScan = vi.fn().mockRejectedValue(new Error("OCR gagal"));
    render(<IdScanField jenis="KTP" onScan={onScan} onApply={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/setuju/i));
    const file = new File([new Uint8Array([1])], "ktp.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("id-scan-file"), { target: { files: [file] } });
    await screen.findByText(/OCR gagal/);
    expect(screen.queryByRole("button", { name: /terapkan/i })).toBeNull();
  });
});

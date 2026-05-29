import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardReaderSheet } from "../CardReaderSheet";

describe("CardReaderSheet", () => {
  it("renders NFC tab by default + QR tab toggle", () => {
    render(<CardReaderSheet open onClose={() => {}} onToken={() => {}} nfcSupported />);
    expect(screen.getByText(/tap kartu/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /qr/i }));
    expect(screen.getByText(/scan qr/i)).toBeInTheDocument();
  });

  it("forces QR when NFC unsupported", () => {
    render(<CardReaderSheet open onClose={() => {}} onToken={() => {}} nfcSupported={false} />);
    expect(screen.queryByRole("button", { name: /nfc/i })).toBeNull();
    expect(screen.getByText(/scan qr/i)).toBeInTheDocument();
  });

  it("fires onClose", () => {
    const onClose = vi.fn();
    render(<CardReaderSheet open onClose={onClose} onToken={() => {}} nfcSupported />);
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

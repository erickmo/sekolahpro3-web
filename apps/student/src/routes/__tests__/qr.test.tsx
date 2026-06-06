// ABS-003 — layar Kartu QR absensi siswa
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QrCardView } from "../qr";

// RTL cleanup tidak otomatis di repo ini (globals on, autoClean off).
afterEach(cleanup);

function mockResolves(value: { token: string; exp: number }) {
  return vi.fn().mockResolvedValue(value);
}

const SAMPLE = { token: "jwt.sample.token", exp: 1_900_000_000 };
const TEST_REFRESH_MS = 60_000;

describe("QrCardView", () => {
  it("memanggil mintQr sekali saat mount dan merender canvas QR", async () => {
    const mintQr = mockResolves(SAMPLE);
    render(<QrCardView mintQr={mintQr} refreshMs={TEST_REFRESH_MS} />);

    expect(screen.getByTestId("qr-canvas")).toBeInTheDocument();
    await waitFor(() => expect(mintQr).toHaveBeenCalledTimes(1));
  });

  it("menampilkan role=alert berisi pesan gagal saat mintQr ditolak", async () => {
    const mintQr = vi.fn().mockRejectedValue(new Error("boom"));
    render(<QrCardView mintQr={mintQr} refreshMs={TEST_REFRESH_MS} />);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/gagal/i);
    });
  });

  it("me-mint ulang QR saat interval refresh terlewati", async () => {
    // ABS-003 — fake timers di-scope ke test ini saja; dua test di atas
    // memakai real timers. advanceTimersByTimeAsync ikut menge-flush
    // microtask promise yang di-await.
    vi.useFakeTimers();
    try {
      const REFRESH_MS = 1_000;
      const mintQr = mockResolves(SAMPLE);
      render(<QrCardView mintQr={mintQr} refreshMs={REFRESH_MS} />);

      await vi.waitFor(() => expect(mintQr).toHaveBeenCalledTimes(1));
      await vi.advanceTimersByTimeAsync(REFRESH_MS);
      expect(mintQr.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

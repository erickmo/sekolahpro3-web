// ABS-002 — layar pairing stasiun
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PairView } from "../pair";

// RTL cleanup tidak otomatis di repo ini (globals on, autoClean off).
afterEach(cleanup);

const SAMPLE_CODE = "ABCD1234";

describe("PairView", () => {
  it("memanggil onPair dengan kode yang sudah di-trim saat submit", async () => {
    const onPair = vi.fn().mockResolvedValue(undefined);
    render(<PairView onPair={onPair} />);

    await userEvent.type(screen.getByLabelText(/kode/i), `  ${SAMPLE_CODE}  `);
    await userEvent.click(screen.getByRole("button", { name: /sambungkan/i }));

    await waitFor(() => expect(onPair).toHaveBeenCalledWith(SAMPLE_CODE));
  });

  it("menampilkan role=alert berisi pesan gagal saat onPair ditolak", async () => {
    const onPair = vi.fn().mockRejectedValue(new Error("boom"));
    render(<PairView onPair={onPair} />);

    await userEvent.type(screen.getByLabelText(/kode/i), SAMPLE_CODE);
    await userEvent.click(screen.getByRole("button", { name: /sambungkan/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/gagal/i);
    });
  });
});

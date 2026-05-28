import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PinFallbackForm } from "../PinFallbackForm";

function wrap(ui: ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PinFallbackForm", () => {
  it("loads persons after nis search and submits with chosen person + pin", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    wrap(<PinFallbackForm gate="Gerbang Utama" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/nis/i), "1001");
    await user.click(screen.getByRole("button", { name: /cari/i }));
    const personSelect = await screen.findByLabelText(/penjemput/i);
    await user.selectOptions(personSelect, "pp-1001-driver");
    await user.type(screen.getByLabelText(/pin/i), "479216");
    await user.click(screen.getByRole("button", { name: /verifikasi/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      nis: "1001",
      pickupPersonId: "pp-1001-driver",
      pin: "479216",
      gate: "Gerbang Utama",
    });
  });
});

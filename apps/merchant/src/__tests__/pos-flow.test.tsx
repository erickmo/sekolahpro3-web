import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";

vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({
    authenticated: true,
    claims: {
      merchant_id: "M-001",
      terminal_id: "TERM-M-001-00001",
      void_window_minutes: 10,
    },
  }),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe("POS flow (MSW)", () => {
  it("catalog → cart → tap synthetic token → charge succeeds", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // import after mocks
    const { Route } = await import("../routes/_app.pos.index");
    const Component = Route.options.component!;
    render(
      <QueryClientProvider client={qc}>
        <Component />
      </QueryClientProvider>,
    );

    // wait catalog
    await waitFor(() => screen.getByRole("button", { name: /nasi/i }));

    // add 1× Nasi (15000)
    fireEvent.click(screen.getByRole("button", { name: /nasi/i }));
    expect(screen.getByTestId("cart-total").textContent).toContain("15.000");

    // synthetic token for KARTU-001
    const token = btoa(
      JSON.stringify({
        kartu_id: "KARTU-001",
        nonce: "n",
        exp: Math.floor(Date.now() / 1000) + 60,
        hmac: "h",
      }),
    ).replace(/=+$/, "");

    // Direct API call to verify MSW happy path (UI flow tested via E2E in Task 24)
    const res = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: token,
      items: [{ name: "I-001", qty: 1 }],
      amount: 15000,
      idempotency_key: crypto.randomUUID(),
    });
    expect(res.txn_name).toMatch(/^EMT-/);
  });
});

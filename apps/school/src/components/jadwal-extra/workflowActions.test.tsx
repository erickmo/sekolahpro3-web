/**
 * Unit tests for useJadwalTransition (SPINE-1).
 *
 * Verifies the hook calls the real workflow endpoint with {name, action} and
 * returns the new workflow_state the server reports, instead of the old fake
 * `status` patch.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mutateAsync = vi.fn();

vi.mock("@sekolahpro/api-client", () => ({
  useFrappeMutation: () => ({ mutateAsync, isPending: false }),
}));

import { useJadwalTransition, JADWAL_ACTIONS } from "./workflowActions";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  mutateAsync.mockReset();
});

describe("useJadwalTransition", () => {
  it("memanggil endpoint workflow dengan name + action lalu mengembalikan state baru", async () => {
    mutateAsync.mockResolvedValue("Diajukan");
    const { result } = renderHook(() => useJadwalTransition(), { wrapper });

    const state = await result.current.transisi("JDW-0001", JADWAL_ACTIONS.ajukan);

    expect(mutateAsync).toHaveBeenCalledWith({ name: "JDW-0001", action: "Ajukan" });
    expect(state).toBe("Diajukan");
  });
});

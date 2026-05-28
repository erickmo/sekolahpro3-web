import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useChildren } from "../children";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useChildren (mock mode)", () => {
  beforeEach(() => {
    (import.meta.env as Record<string, string>).VITE_USE_MOCKS = "true";
  });

  it("returns mocked child list", async () => {
    const { result } = renderHook(() => useChildren(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0]?.nis).toBe("1001");
  });
});

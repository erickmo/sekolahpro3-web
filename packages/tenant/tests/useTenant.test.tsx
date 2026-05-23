import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient, configure } from "@sekolahpro/api-client";
import { useTenant } from "../src/useTenant";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = createQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  configure({ baseUrl: "https://api.test" });
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(
      JSON.stringify({
        message: {
          tenant_id: "sd-merdeka",
          name: "SD Merdeka",
          logo: null,
          theme: { brand_color: "#0055ff" },
          features: ["nilai", "absensi"],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ));
});

describe("useTenant", () => {
  it("resolves the host to a tenant", async () => {
    const { result } = renderHook(() => useTenant("app.sekolahpro.id"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.tenantId).toBe("sd-merdeka");
    expect(result.current.data?.features).toContain("nilai");
  });
});

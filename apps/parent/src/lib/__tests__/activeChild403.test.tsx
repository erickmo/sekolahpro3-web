import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { FrappeError } from "@sekolahpro/api-client";
import { ActiveChildProvider, useActiveChild } from "../activeChild";
import { ChildAccessNotice } from "../../components/ChildAccessNotice";

const DENIED_NIS = "1002";

function DeniedChildProbe() {
  const { activeNis } = useActiveChild();
  // Simulate a per-child fetch that the backend rejects with 403.
  useQuery({
    queryKey: ["sekolahpro.api.parent.child_dashboard", { nis: DENIED_NIS }],
    queryFn: async () => {
      throw new FrappeError(403, null, "forbidden");
    },
    retry: false,
  });
  return <span data-testid="active">{activeNis ?? "none"}</span>;
}

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ActiveChildProvider>
        <ChildAccessNotice />
        <DeniedChildProbe />
      </ActiveChildProvider>
    </QueryClientProvider>,
  );
}

describe("ActiveChildProvider 403 handling", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("activeChildNis", DENIED_NIS);
    import.meta.env.VITE_USE_MOCKS = "true";
  });

  it("shows notice and resets to first authorized child on 403", async () => {
    wrap();
    await screen.findByText("Tidak punya akses ke siswa ini");
    await waitFor(() => expect(screen.getByTestId("active").textContent).toBe("1001"));
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveChildProvider, useActiveChild } from "../activeChild";

function Probe() {
  const { activeNis, setActiveNis, children, isLoading } = useActiveChild();
  return (
    <div>
      <span data-testid="nis">{activeNis ?? "none"}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="count">{children.length}</span>
      <button onClick={() => setActiveNis("1002")}>switch</button>
    </div>
  );
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><ActiveChildProvider>{ui}</ActiveChildProvider></QueryClientProvider>);
}

describe("ActiveChildProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    (import.meta.env as any).VITE_USE_MOCKS = "true";
  });

  it("defaults activeNis to first child once loaded", async () => {
    wrap(<Probe />);
    await screen.findByText("1001");
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("persists selection to sessionStorage", async () => {
    wrap(<Probe />);
    await screen.findByText("1001");
    act(() => { screen.getByText("switch").click(); });
    expect(sessionStorage.getItem("activeChildNis")).toBe("1002");
  });

  it("restores selection from sessionStorage", async () => {
    sessionStorage.setItem("activeChildNis", "1002");
    wrap(<Probe />);
    await screen.findByText("1002");
  });
});

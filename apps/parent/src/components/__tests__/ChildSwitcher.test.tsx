import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveChildProvider, useActiveChild } from "../../lib/activeChild";
import { ChildSwitcher } from "../ChildSwitcher";

function Active() {
  const { activeNis } = useActiveChild();
  return <span data-testid="active">{activeNis}</span>;
}

function wrap() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ActiveChildProvider>
        <ChildSwitcher />
        <Active />
      </ActiveChildProvider>
    </QueryClientProvider>,
  );
}

describe("ChildSwitcher", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders active child name", async () => {
    wrap();
    expect(await screen.findByText(/Andi Pratama/)).toBeInTheDocument();
  });

  it("switches active child on selection", async () => {
    const user = userEvent.setup();
    wrap();
    await screen.findByText(/Andi Pratama/);
    await user.click(screen.getByRole("button", { name: /pilih anak/i }));
    await user.click(screen.getByRole("menuitem", { name: /Bunga Pratami/ }));
    expect(screen.getByTestId("active").textContent).toBe("1002");
  });
});

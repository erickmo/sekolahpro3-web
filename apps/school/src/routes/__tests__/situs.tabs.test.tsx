import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useRouterState: () => "/sch/smp-demo/situs",
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

import { SitusLayout } from "../sch.$sekolah.situs";

afterEach(() => cleanup());

describe("Situs tabs", () => {
  it("includes the Phase-3 Tata Letak and Sorotan tabs", () => {
    render(<SitusLayout />);
    expect(screen.getByText("Tata Letak")).toBeInTheDocument();
    expect(screen.getByText("Sorotan")).toBeInTheDocument();
    // Existing tabs remain.
    expect(screen.getByText("Tampilan")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
  });
});

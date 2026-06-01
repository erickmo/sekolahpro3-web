import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// TanStack Link needs no router context in tests.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import { toNavTabGroups, KeuanganHubNav } from "../KeuanganHubNav";
import { KeuanganRoleChips } from "../KeuanganRoleChips";
import { KeuanganPageGuide } from "../KeuanganPageGuide";

afterEach(cleanup);

describe("toNavTabGroups", () => {
  it("flattens hub groups into NavTabGroup[] keeping to/label/exact", () => {
    const groups = toNavTabGroups();
    expect(groups.map((g) => g.label)).toEqual(["Ringkasan", "Operasional", "Akuntansi"]);
    const dashboard = groups[0]!.items[0]!;
    expect(dashboard).toEqual({ to: "/sch/$sekolah/keuangan", label: "Dashboard", exact: true });
  });
});

describe("KeuanganHubNav", () => {
  it("renders the dashboard and pages across both route trees", () => {
    render(<KeuanganHubNav pathname="/sch/x/keuangan" />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Tagihan")).toBeTruthy();
    expect(screen.getByText("Buku Besar")).toBeTruthy();
  });
});

describe("KeuanganRoleChips", () => {
  it("renders a chip for every finance role and marks the active one", () => {
    render(<KeuanganRoleChips active="bendahara" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Bendahara/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Kasir/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Akuntan/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Kepala Sekolah/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Bendahara/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onSelect with the chosen role", () => {
    const onSelect = vi.fn();
    render(<KeuanganRoleChips active="bendahara" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Akuntan/i }));
    expect(onSelect).toHaveBeenCalledWith("akuntan");
  });
});

describe("KeuanganPageGuide", () => {
  it("renders steps with keuangan role labels", () => {
    render(<KeuanganPageGuide storageId="t" steps={[{ title: "Catat kas", roles: ["kasir"] }]} />);
    expect(screen.getByText("Catat kas")).toBeTruthy();
    expect(screen.getByText(/Kasir/i)).toBeTruthy();
  });
});
